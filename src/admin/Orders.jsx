import { useMemo, useState } from 'react';
import { allOrders, advanceOrder, cancelOrder, nextStep, STEP, CANCEL_REASONS } from '../lib/orders';
import Track from '../components/Track';
import { useShop } from '../lib/store';
import { toman, fa } from '../lib/format';

/**
 * Orders, as the shop sees them.
 *
 * The panel's job here is to refuse. Moving an order forward asks for whatever
 * that step is defined as needing (lib/orders.js) and will not proceed without
 * it — no order gets marked sent with an empty tracking field, because in the
 * world outside this screen that number is the only proof it left the building.
 */

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const art = {
  chevron: <path d="m9 5 7 7-7 7" />,
  next: <path d="M5 12h14M13 6l6 6-6 6" />,
};

const when = (iso) => new Date(iso).toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' });

/* «پرداخت نشده» is not a filter because it is not a state anything can be
   in: an order reaches this panel only after the gateway has taken the money. */
const FILTERS = [
  ['all', 'همه'],
  ['paid', 'سفارش تازه'],
  ['packing', 'آماده‌سازی'],
  ['sent', 'ارسال شده'],
  ['canceled', 'لغو شده'],
];

export default function Orders() {
  const { toast } = useShop();
  const [rows, setRows] = useState(() => allOrders());
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState(null);

  const shown = useMemo(
    () => (filter === 'all' ? rows : rows.filter((o) => o.status === filter)),
    [rows, filter]
  );

  const revenue = rows.filter((o) => o.status !== 'canceled').reduce((s, o) => s + o.total, 0);

  const refresh = () => setRows(allOrders());

  const move = (id, info) => {
    const res = advanceOrder(id, info);
    if (!res.ok) return toast(res.error, 'warn');
    refresh();
    toast(`سفارش ${id} → ${STEP[res.order.status].title}`);
    return res;
  };

  const drop = (id, info) => {
    const res = cancelOrder(id, info);
    if (!res.ok) return toast(res.error, 'warn');
    refresh();
    toast(`سفارش ${id} لغو شد`, 'warn');
    return res;
  };

  const counts = Object.fromEntries(FILTERS.map(([k]) => [k, k === 'all' ? rows.length : rows.filter((o) => o.status === k).length]));

  return (
    <>
      <h1 style={{ fontSize: 'var(--t-h1)' }}>سفارش‌ها</h1>
      <p className="muted" style={{ fontSize: 'var(--t-sm)' }}>
        {fa(rows.length)} سفارش · {toman(revenue)} تأییدشده
      </p>

      <div className="suggestions bleed filter-row" style={{ marginBlockStart: 'var(--s4)' }}>
        {FILTERS.map(([k, label]) => (
          <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
            {label} <span className="num">({fa(counts[k])})</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="panel"><p className="panel-empty">سفارشی با این وضعیت نیست.</p></div>
      ) : (
        <div className="order-cards">
          {shown.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              open={openId === o.id}
              onToggle={() => setOpenId(openId === o.id ? null : o.id)}
              onMove={move}
              onCancel={drop}
            />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Cancelling, in two deliberate moves.
 *
 * One click asks; a second, with a reason attached, does it. Cancelling a paid
 * order owes the customer money back, so the reason and the refund reference
 * are collected here rather than reconstructed from memory later.
 */
function CancelBox({ order, onCancel }) {
  const [asking, setAsking] = useState(false);
  const [form, setForm] = useState({ reason: '', detail: '', refundRef: '' });
  const [error, setError] = useState('');

  if (!asking) {
    return (
      <button className="btn-quiet danger cancel-open" onClick={() => setAsking(true)}>
        لغو سفارش
      </button>
    );
  }

  const confirm = (e) => {
    e.preventDefault();
    const res = onCancel(order.id, form);
    if (res && !res.ok) setError(res.error);
  };

  return (
    <form className="cancelbox" onSubmit={confirm}>
      <b>مطمئنی این سفارش لغو شود؟</b>
      <p>
        این سفارش پرداخت شده است، پس لغو یعنی {toman(order.total)} باید به مشتری برگردد.
        {order.status === 'sent' && ' مرسوله هم تحویل پست شده — اگر برگشت خورده، همین‌جا ثبت کنید.'}
      </p>

      <label>
        <span className="label">دلیل لغو</span>
        <select
          className="field"
          value={form.reason}
          onChange={(e) => { setForm({ ...form, reason: e.target.value }); setError(''); }}
        >
          <option value="">انتخاب کنید…</option>
          {CANCEL_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>

      <label>
        <span className="label">توضیح <small className="muted">(اختیاری)</small></span>
        <input className="field" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
      </label>

      <label>
        <span className="label">
          کد پیگیری بازگشت وجه
          <small className="muted"> — اگر هنوز برنگردانده‌اید خالی بگذارید</small>
        </span>
        <input className="field num" dir="ltr" value={form.refundRef} onChange={(e) => setForm({ ...form, refundRef: e.target.value })} />
      </label>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="row" style={{ gap: 'var(--s3)', flexWrap: 'wrap' }}>
        <button className="btn btn-danger" type="submit">بله، لغو کن</button>
        <button className="btn btn-ghost" type="button" onClick={() => { setAsking(false); setError(''); }}>
          نه، برگرد
        </button>
      </div>
    </form>
  );
}

function OrderCard({ order, open, onToggle, onMove, onCancel }) {
  const step = STEP[order.status];
  const next = nextStep(order);
  const [info, setInfo] = useState({});
  const [error, setError] = useState('');
  const canceled = order.status === 'canceled';

  const submit = (e) => {
    e.preventDefault();
    const res = onMove(order.id, info);
    if (res && !res.ok) setError(res.error);
    else { setInfo({}); setError(''); }
  };

  return (
    <article className={`order-card ${open ? 'open' : ''}`}>
      <button className="order-head" onClick={onToggle} aria-expanded={open}>
        <span className="order-id num">{order.id}</span>
        <span className="order-who">
          <b>{order.customer.name}</b>
          <small>{order.address.city} · {when(order.createdAt)}</small>
        </span>
        <span className={`pill ${canceled ? 'wait' : step?.tone}`}>{canceled ? 'لغو شده' : step?.short}</span>
        <b className="num order-total">{toman(order.total, { unit: false })}</b>
        <Icon d={art.chevron} size={15} />
      </button>

      {open && (
        <div className="order-body">
          <div className="order-grid">
            <section>
              <h4>مشتری</h4>
              <p>{order.customer.name}</p>
              {order.customer.phone && <p className="num">{fa(order.customer.phone)}</p>}
              {order.customer.email && <p dir="ltr" className="muted">{order.customer.email}</p>}
            </section>

            <section>
              <h4>نشانی</h4>
              <p>{order.address.province} · {order.address.city}</p>
              <p className="muted">{order.address.street}</p>
              <p className="muted num">
                {order.address.receiver}{order.address.phone && <> — {fa(order.address.phone)}</>}
                {order.address.postal && <> · کدپستی {fa(order.address.postal)}</>}
              </p>
            </section>

            <section>
              <h4>کدها</h4>
              <p>
                پرداخت:{' '}
                {order.payment ? <span dir="ltr" className="num">{order.payment.ref}</span> : <span className="muted">—</span>}
              </p>
              <p>
                رهگیری:{' '}
                {order.shipment
                  ? <><span dir="ltr" className="num">{order.shipment.tracking}</span> <small className="muted">({order.shipment.carrier})</small></>
                  : <span className="muted">—</span>}
              </p>
            </section>
          </div>

          <h4>اقلام</h4>
          <ul className="check-lines">
            {order.lines.map((l, i) => (
              <li key={i}>
                <span>
                  {l.name}
                  {l.color && <small className="muted"> — {l.color}، {l.size} × {fa(l.qty)}</small>}
                </span>
                <b className="num">{toman(l.price * l.qty, { unit: false })}</b>
              </li>
            ))}
          </ul>

          <h4>مسیر</h4>
          <Track order={order} compact />

          {!canceled && next && (
            <form className="advance" onSubmit={submit}>
              <h4>بردن به «{next.title}»</h4>
              {(next.needs ?? []).map((f) => (
                <label key={f.name}>
                  <span className="label">
                    {f.label}
                    {f.hint && <small className="muted"> — {f.hint}</small>}
                  </span>
                  {f.options ? (
                    <select
                      className="field"
                      value={info[f.name] ?? ''}
                      onChange={(e) => { setInfo({ ...info, [f.name]: e.target.value }); setError(''); }}
                    >
                      <option value="">انتخاب کنید…</option>
                      {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      className="field"
                      dir={f.dir}
                      value={info[f.name] ?? ''}
                      onChange={(e) => { setInfo({ ...info, [f.name]: e.target.value }); setError(''); }}
                    />
                  )}
                </label>
              ))}
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="btn btn-primary" type="submit">
                <Icon d={art.next} size={15} /> ثبت و بردن به مرحلهٔ بعد
              </button>
            </form>
          )}

          {!canceled && !next && (
            <p className="panel-empty">
              این سفارش تحویل پست شده و مرحلهٔ دیگری ندارد. بقیهٔ مسیر را مشتری با کد رهگیری دنبال می‌کند.
            </p>
          )}

          {canceled && order.refund && (
            <div className="refund-note">
              <b>لغو شد — {order.refund.reason}</b>
              {order.refund.detail && <p>{order.refund.detail}</p>}
              <p>
                بازگشت وجه {toman(order.refund.amount)}:{' '}
                {order.refund.status === 'done'
                  ? <>انجام شد — کد <span dir="ltr" className="num">{order.refund.ref}</span></>
                  : 'هنوز ثبت نشده'}
              </p>
            </div>
          )}

          {!canceled && <CancelBox order={order} onCancel={onCancel} />}
        </div>
      )}
    </article>
  );
}
