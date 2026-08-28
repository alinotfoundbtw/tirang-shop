import { Link, Navigate, useParams } from 'react-router-dom';
import { STEP, ordersFor, orderById } from '../lib/orders';
import Track from '../components/Track';
import { useAccount } from '../lib/account';
import { useSeo } from '../lib/seo';
import { toman, fa } from '../lib/format';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const art = {
  back: <path d="M14 5 7 12l7 7" />,
  copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M6 15H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1" /></>,
  box: <><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></>,
};

const when = (iso) =>
  new Date(iso).toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' });

/* ── The list ─────────────────────────────────────────── */
export function Orders() {
  const acc = useAccount();
  useSeo({ title: 'خریدهای من', path: '/orders', noindex: true });

  if (!acc.signedIn) return <Navigate to="/enter" replace />;

  const list = ordersFor(acc.user.phone);

  return (
    <div className="wrap orders">
      <h1>خریدهای اخیر</h1>

      {list.length === 0 ? (
        <div className="panel">
          <p className="panel-empty">هنوز خریدی نکرده‌ای. هر سفارشی که ثبت کنی اینجا با وضعیتش می‌آید.</p>
          <Link to="/products" className="btn btn-primary">دیدن تیشرت‌ها</Link>
        </div>
      ) : (
        <ul className="order-list">
          {list.map((o) => {
            const step = STEP[o.status];
            return (
              <li key={o.id}>
                <Link to={`/orders/${encodeURIComponent(o.id)}`}>
                  <div className="order-row">
                    <span>
                      <b className="num">{o.id}</b>
                      <small>{when(o.createdAt)} · {fa(o.lines.reduce((s, l) => s + l.qty, 0))} قلم</small>
                    </span>
                    <span className={`pill ${o.status === 'canceled' ? 'wait' : step?.tone}`}>
                      {o.status === 'canceled' ? 'لغو شده' : step?.short}
                    </span>
                    <b className="num order-total">{toman(o.total, { unit: false })}</b>
                  </div>
                  <div className="order-thumbs">
                    {o.lines.slice(0, 4).map((l, i) => (
                      l.photo ? <img key={i} src={l.photo} alt="" loading="lazy" decoding="async" /> : null
                    ))}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── One order ────────────────────────────────────────── */
export function OrderDetail() {
  const { id } = useParams();
  const acc = useAccount();
  useSeo({ title: `سفارش ${id}`, path: `/orders/${id}`, noindex: true });

  if (!acc.signedIn) return <Navigate to="/enter" replace />;

  const order = orderById(decodeURIComponent(id));
  // Someone else's order id in the address bar must not open it, even in a
  // demo where both sit in the same storage.
  if (!order || order.customer?.phone !== acc.user.phone) {
    return (
      <div className="wrap" style={{ paddingBlock: 'var(--s6)' }}>
        <h1 style={{ fontSize: 'var(--t-h1)' }}>این سفارش پیدا نشد</h1>
        <p className="muted" style={{ marginBlock: 'var(--s3)' }}>شاید با حساب دیگری ثبت شده باشد.</p>
        <Link to="/orders" className="btn btn-primary">خریدهای من</Link>
      </div>
    );
  }


  return (
    <div className="wrap orders">
      <Link to="/orders" className="console-exit"><Icon d={art.back} size={15} /> خریدهای من</Link>
      <h1 className="num">سفارش {order.id}</h1>
      <p className="muted">ثبت شده در {when(order.createdAt)}</p>

      <Track order={order} />

      <div className="panel">
        <h3>کدها</h3>
        <dl className="spec">
          {order.payment && (
            <>
              <dt>کد پیگیری پرداخت</dt>
              <dd><Copy value={order.payment.ref} /></dd>
            </>
          )}
          {order.shipment ? (
            <>
              <dt>شرکت پست</dt><dd>{order.shipment.carrier}</dd>
              <dt>کد رهگیری مرسوله</dt>
              <dd><Copy value={order.shipment.tracking} /></dd>
            </>
          ) : (
            <>
              <dt>کد رهگیری</dt>
              <dd className="muted">بعد از تحویل به پست اینجا می‌آید.</dd>
            </>
          )}
        </dl>
      </div>

      <div className="panel">
        <h3>اقلام</h3>
        <ul className="check-lines">
          {order.lines.map((l, i) => (
            <li key={i}>
              <span>
                {l.slug ? <Link to={`/p/${l.slug}`} className="link-more">{l.name}</Link> : l.name}
                {l.color && <small className="muted"> — {l.color}، {l.size} × {fa(l.qty)}</small>}
              </span>
              <b className="num">{toman(l.price * l.qty, { unit: false })}</b>
            </li>
          ))}
        </ul>
        <div className="totals" style={{ marginBlockStart: 'var(--s4)' }}>
          <div className="row between"><span>جمع کالاها</span><b className="num">{toman(order.subtotal)}</b></div>
          <div className="row between"><span>ارسال</span><b className="num">{order.shipping ? toman(order.shipping) : 'رایگان'}</b></div>
          <div className="row between sum"><span>پرداخت‌شده</span><b className="num">{toman(order.total)}</b></div>
        </div>
      </div>

      <div className="panel">
        <h3><Icon d={art.box} size={16} /> نشانی تحویل</h3>
        <p>{order.address.province} · {order.address.city}</p>
        <p className="muted">{order.address.street}</p>
        <p className="muted num">{order.address.receiver} — {fa(order.address.phone)}</p>
      </div>
    </div>
  );
}

/** A code you cannot select on a phone is a code you have to retype. */
function Copy({ value }) {
  return (
    <button
      className="copy-code num"
      onClick={() => navigator.clipboard?.writeText(value)}
      title="کپی"
    >
      <span dir="ltr">{value}</span>
      <Icon d={art.copy} size={14} />
    </button>
  );
}
