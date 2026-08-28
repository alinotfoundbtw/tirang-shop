/* ───────────────────────────────────────────────────────────────
   Orders — one shared record, read by the shopper and the shop.

   There is no server, so both sides read the same localStorage key in
   the same browser. That is the honest limit of this demo: a real
   customer's order cannot reach the owner's laptop without one. What
   *is* real is the workflow — the states, what each transition costs,
   and the fact that nothing can move forward on a wish.

   The rule this file exists to enforce: a status change that carries
   information the shop does not have yet is not allowed. You cannot
   mark an order paid without the gateway's reference, and you cannot
   mark it sent without a tracking number, because in the world outside
   this file those numbers are how anyone proves either happened.
   ─────────────────────────────────────────────────────────────── */

/* Explicit .js so this module also loads under plain Node, where the
   order pipeline can be driven without a browser. */
import { orders as seedOrders } from '../data/products.js';
import { fa } from './format.js';

const KEY = 'tirang.orders.v1';

/** The pipeline, in order. Each step declares what it needs to be entered. */
export const FLOW = [
  {
    key: 'wait',
    title: 'در انتظار پرداخت',
    short: 'پرداخت نشده',
    tone: 'wait',
    customer: 'سفارش ثبت شد و منتظر پرداخت است.',
  },
  {
    key: 'paid',
    title: 'پرداخت شد',
    short: 'پرداخت شده',
    tone: 'paid',
    // The gateway's own reference. Without it there is nothing to reconcile
    // against the bank statement, and no way to answer "I paid, where is it?"
    needs: [
      { name: 'ref', label: 'کد پیگیری پرداخت', hint: 'کدی که درگاه بعد از پرداخت می‌دهد', required: true, dir: 'ltr' },
    ],
    customer: 'پرداخت تأیید شد.',
  },
  {
    key: 'packing',
    title: 'در حال آماده‌سازی',
    short: 'آماده‌سازی',
    tone: 'wait',
    needs: [{ name: 'note', label: 'یادداشت (اختیاری)', hint: 'مثلاً: چاپ سفارشی، دو روز کاری' }],
    customer: 'سفارش در حال بسته‌بندی است.',
  },
  {
    key: 'sent',
    title: 'ارسال شد',
    short: 'ارسال شده',
    tone: 'sent',
    needs: [
      { name: 'carrier', label: 'شرکت پست', required: true, options: ['پست پیشتاز', 'تیپاکس', 'چاپار', 'ماهکس', 'پیک تهران'] },
      { name: 'tracking', label: 'کد رهگیری مرسوله', hint: 'همان کدی که روی رسید پست است', required: true, dir: 'ltr' },
    ],
    customer: 'مرسوله تحویل پست شد.',
  },
  {
    key: 'delivered',
    title: 'تحویل شد',
    short: 'تحویل شده',
    tone: 'paid',
    needs: [{ name: 'receiver', label: 'تحویل‌گیرنده', hint: 'اسم کسی که بسته را گرفته', required: true }],
    customer: 'بسته تحویل داده شد.',
  },
];

export const STEP = Object.fromEntries(FLOW.map((s) => [s.key, s]));
export const stepIndex = (key) => FLOW.findIndex((s) => s.key === key);

/** The one step an order may move to next, or null at the end. */
export const nextStep = (order) => {
  if (order.status === 'canceled') return null;
  return FLOW[stepIndex(order.status) + 1] ?? null;
};

const pad = (n) => String(n).padStart(4, '0');
const nowISO = () => new Date().toISOString();

/* Reference codes are generated here only because there is no gateway to
   generate them. Shaped like the real thing so the panel is laid out for
   real ones: the gateway's value replaces this and nothing else changes. */
const refCode = () => `TRG${Date.now().toString().slice(-9)}`;

const read = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) return saved;
  } catch { /* fall through to the seed */ }
  return seed();
};

const write = (list) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* quota or private mode — this session keeps what it has */ }
  return list;
};

/** The demo rows, lifted into the real shape so the panel is never empty. */
function seed() {
  const list = seedOrders.map((o, i) => ({
    id: o.id,
    createdAt: new Date(Date.now() - (i + 2) * 86400000).toISOString(),
    demo: true,
    customer: { name: o.customer, phone: '', email: '' },
    address: { province: o.city, city: o.city, street: '—', receiver: o.customer, phone: '', postal: '' },
    lines: [{ name: `${o.items} قلم کالا`, qty: o.items, price: Math.round(o.total / o.items) }],
    subtotal: o.total,
    shipping: 0,
    total: o.total,
    payment: o.status === 'wait' ? null : { ref: refCode(), at: nowISO() },
    shipment: o.status === 'sent' ? { carrier: 'پست پیشتاز', tracking: `IR${Date.now().toString().slice(-11)}`, at: nowISO() } : null,
    status: o.status,
    history: [{ at: nowISO(), status: o.status, by: 'seed' }],
  }));
  return write(list);
}

export const allOrders = () => read();

export const ordersFor = (phone) =>
  read().filter((o) => o.customer?.phone && o.customer.phone === phone);

export const orderById = (id) => read().find((o) => o.id === id) ?? null;

/** Places an order straight into `paid`: the shopper has just come back from
 *  the gateway, and an order that reaches this function has been paid for. */
export function placeOrder({ customer, address, lines, subtotal, shipping }) {
  const list = read();
  const seq = list.filter((o) => !o.demo).length + 1;
  const ref = refCode();
  const order = {
    // Both halves in Persian digits; the seed ids already are, and
    // «۱۴۰۵-2001» is the kind of mixed-script id nobody reads aloud twice.
    id: `۱۴۰۵-${fa(pad(2000 + seq))}`,
    createdAt: nowISO(),
    customer,
    address,
    lines,
    subtotal,
    shipping,
    total: subtotal + shipping,
    payment: { ref, at: nowISO() },
    shipment: null,
    status: 'paid',
    history: [
      { at: nowISO(), status: 'wait', by: 'customer' },
      { at: nowISO(), status: 'paid', by: 'gateway', info: { ref } },
    ],
  };
  write([order, ...list]);
  return order;
}

/**
 * Moves an order one step forward.
 *
 * Refuses rather than guesses: a missing tracking number comes back as an
 * error the panel can show, not as an order marked sent with nothing behind it.
 */
export function advanceOrder(id, info = {}) {
  const list = read();
  const order = list.find((o) => o.id === id);
  if (!order) return { ok: false, error: 'سفارش پیدا نشد.' };

  const step = nextStep(order);
  if (!step) return { ok: false, error: 'این سفارش مرحلهٔ بعدی ندارد.' };

  for (const field of step.needs ?? []) {
    if (field.required && !String(info[field.name] ?? '').trim()) {
      return { ok: false, error: `${field.label} لازم است.` };
    }
  }

  const at = nowISO();
  const updated = {
    ...order,
    status: step.key,
    history: [...order.history, { at, status: step.key, by: 'shop', info }],
  };
  if (step.key === 'paid') updated.payment = { ref: info.ref.trim(), at };
  if (step.key === 'sent') updated.shipment = { carrier: info.carrier, tracking: info.tracking.trim(), at };
  if (step.key === 'delivered') updated.deliveredTo = info.receiver.trim();

  write(list.map((o) => (o.id === id ? updated : o)));
  return { ok: true, order: updated };
}

export function cancelOrder(id, reason = '') {
  const list = read();
  const order = list.find((o) => o.id === id);
  if (!order) return { ok: false, error: 'سفارش پیدا نشد.' };
  if (order.status === 'sent' || order.status === 'delivered') {
    return { ok: false, error: 'سفارشی که ارسال شده را نمی‌شود لغو کرد.' };
  }
  const updated = {
    ...order,
    status: 'canceled',
    history: [...order.history, { at: nowISO(), status: 'canceled', by: 'shop', info: { reason } }],
  };
  write(list.map((o) => (o.id === id ? updated : o)));
  return { ok: true, order: updated };
}
