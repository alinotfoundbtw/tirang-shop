import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop, FREE_SHIPPING } from '../lib/store';
import { useAccount } from '../lib/account';
import { placeOrder } from '../lib/orders';
import { useSeo } from '../lib/seo';
import { toman, fa } from '../lib/format';

/**
 * Checkout.
 *
 * The payment step is simulated and the page says so before you press it,
 * not after. Everything either side of that step is the real shape: a chosen
 * address, a frozen copy of the lines and their prices, and an order that
 * comes back carrying the reference a gateway would have handed over.
 *
 * The lines are copied rather than referenced on purpose. An order is what
 * was bought at the price it cost; if the catalog changes tomorrow, last
 * week's receipt must not change with it.
 */
export default function Checkout() {
  const { lines, subtotal, shipping, dispatch, toast } = useShop();
  const acc = useAccount();
  const navigate = useNavigate();
  const [addressId, setAddressId] = useState(acc.addresses.find((a) => a.isDefault)?.id ?? acc.addresses[0]?.id ?? '');
  const [paying, setPaying] = useState(false);

  useSeo({ title: 'پرداخت', path: '/checkout', noindex: true });

  if (!lines.length) {
    return (
      <div className="wrap" style={{ paddingBlock: 'var(--s6)' }}>
        <h1 style={{ fontSize: 'var(--t-h1)' }}>سبد خالی است</h1>
        <p className="muted" style={{ marginBlock: 'var(--s3)' }}>اول چیزی به سبد اضافه کن.</p>
        <Link to="/products" className="btn btn-primary">دیدن تیشرت‌ها</Link>
      </div>
    );
  }

  if (!acc.signedIn) {
    return (
      <div className="wrap" style={{ paddingBlock: 'var(--s6)' }}>
        <h1 style={{ fontSize: 'var(--t-h1)' }}>برای ادامه وارد شو</h1>
        <p className="muted" style={{ marginBlock: 'var(--s3)', maxWidth: '44ch' }}>
          سفارش به یک حساب بسته می‌شود تا بتوانی بعداً وضعیتش را دنبال کنی.
        </p>
        <Link to="/enter" className="btn btn-primary">ورود یا ثبت‌نام</Link>
      </div>
    );
  }

  const address = acc.addresses.find((a) => a.id === addressId);

  const pay = () => {
    if (!address) return toast('اول یک آدرس انتخاب کن', 'warn');
    setPaying(true);
    // Stands in for the round-trip to the gateway, so the waiting state is a
    // real code path rather than something to bolt on later.
    setTimeout(() => {
      const order = placeOrder({
        customer: { name: acc.user.name, phone: acc.user.phone, email: acc.user.email },
        address,
        lines: lines.map((l) => ({
          id: l.product.id,
          slug: l.product.slug,
          name: l.product.name,
          color: l.color,
          size: l.product.sizeLabels?.[l.size] ?? l.size,
          qty: l.qty,
          price: l.product.price,
          photo: l.product.colors.find((c) => c.name === l.color)?.photos[0] ?? l.product.colors[0].photos[0],
        })),
        subtotal,
        shipping,
      });
      dispatch({ type: 'clear' });
      toast('پرداخت انجام شد');
      navigate(`/orders/${encodeURIComponent(order.id)}`, { replace: true });
    }, 900);
  };

  return (
    <div className="wrap checkout">
      <h1>پرداخت</h1>

      <section className="panel">
        <h3>تحویل به</h3>
        {acc.addresses.length === 0 ? (
          <>
            <p className="panel-empty">هنوز آدرسی ثبت نکرده‌ای.</p>
            <Link to="/profile" className="btn btn-primary">افزودن آدرس</Link>
          </>
        ) : (
          <ul className="pick-list">
            {acc.addresses.map((a) => (
              <li key={a.id}>
                <label className={addressId === a.id ? 'on' : ''}>
                  <input
                    type="radio"
                    name="address"
                    checked={addressId === a.id}
                    onChange={() => setAddressId(a.id)}
                  />
                  <span>
                    <b>{a.label} — {a.city}</b>
                    <small>{a.street}</small>
                    <small className="num">{a.receiver} · {fa(a.phone)}</small>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <h3>سفارش</h3>
        <ul className="check-lines">
          {lines.map((l) => (
            <li key={l.key}>
              <span>
                {l.product.name}
                <small className="muted"> — {l.color}، {l.product.sizeLabels?.[l.size] ?? l.size} × {fa(l.qty)}</small>
              </span>
              <b className="num">{toman(l.product.price * l.qty, { unit: false })}</b>
            </li>
          ))}
        </ul>
        <div className="totals" style={{ marginBlockStart: 'var(--s4)' }}>
          <div className="row between"><span>جمع کالاها</span><b className="num">{toman(subtotal)}</b></div>
          <div className="row between">
            <span>ارسال</span>
            <b className="num">{shipping ? toman(shipping) : 'رایگان'}</b>
          </div>
          {shipping > 0 && (
            <span className="muted" style={{ fontSize: 'var(--t-xs)' }}>
              با {toman(FREE_SHIPPING - subtotal)} خرید بیشتر، ارسال رایگان می‌شود.
            </span>
          )}
          <div className="row between sum"><span>قابل پرداخت</span><b className="num">{toman(subtotal + shipping)}</b></div>
        </div>
      </section>

      <button className="btn btn-primary btn-block" onClick={pay} disabled={paying || !address}>
        {paying ? 'در حال اتصال به درگاه…' : `پرداخت ${toman(subtotal + shipping)}`}
      </button>

      <p className="checkout-note">
        این پرداخت شبیه‌سازی است — به درگاه واقعی وصل نیست و هیچ مبلغی از حسابی کم نمی‌شود.
        سفارش با یک «کد پیگیری پرداخت» ساخته می‌شود تا بقیهٔ مسیر، از آماده‌سازی تا رهگیری پست،
        همان‌طور کار کند که با درگاه واقعی کار می‌کند.
      </p>
    </div>
  );
}
