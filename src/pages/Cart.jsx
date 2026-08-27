import { Link } from 'react-router-dom';
import { useShop, FREE_SHIPPING } from '../lib/store';
import { Photo, EmptyState } from '../components/States';
import { toman, fa } from '../lib/format';
import { useSeo } from '../lib/seo';

export default function Cart() {
  const { lines, dispatch, subtotal, shipping, toast } = useShop();
  useSeo({ title: 'سبد خرید', noindex: true, path: '/cart' });

  if (!lines.length)
    return (
      <div className="wrap">
        <EmptyState
          title="سبد هنوز خالی است"
          body="یک تیشرت انتخاب کنید تا اینجا بنشیند."
          action={<Link to="/products" className="btn btn-primary">دیدن تیشرت‌ها</Link>}
        />
      </div>
    );

  const missing = Math.max(0, FREE_SHIPPING - subtotal);
  const pct = Math.min(100, (subtotal / FREE_SHIPPING) * 100);

  return (
    <div className="wrap" style={{ paddingBlock: 'var(--s5)' }}>
      <h1 style={{ fontSize: 'var(--t-h1)' }}>سبد خرید</h1>

      <div style={{ marginBlockStart: 'var(--s4)' }}>
        {lines.map((l) => {
          const color = l.product.colors.find((c) => c.name === l.color) || l.product.colors[0];
          return (
            <div className="line" key={l.key}>
              <Link to={`/p/${l.product.slug}`}>
                <Photo src={color.photos[0]} alt={`${l.product.name} — ${l.color}`} tone={color.hex} sizes="76px" />
              </Link>
              <div>
                <Link to={`/p/${l.product.slug}`}>
                  <b style={{ fontFamily: 'var(--font-display)' }}>{l.product.name}</b>
                </Link>
                <div className="muted" style={{ fontSize: 'var(--t-xs)' }}>
                  {l.color} · اندازه {l.product.sizeLabels?.[l.size] ?? l.size}
                </div>
                <div className="row" style={{ marginBlockStart: 'var(--s2)', gap: 'var(--s3)' }}>
                  <div className="qty">
                    <button onClick={() => dispatch({ type: 'qty', key: l.key, by: -1 })} aria-label="کم‌کردن">−</button>
                    <span className="num">{fa(l.qty)}</span>
                    <button onClick={() => dispatch({ type: 'qty', key: l.key, by: 1 })} aria-label="زیادکردن">+</button>
                  </div>
                  <button
                    className="btn-quiet"
                    style={{ fontSize: 'var(--t-xs)' }}
                    onClick={() => { dispatch({ type: 'remove', key: l.key }); toast('از سبد حذف شد'); }}
                  >
                    حذف
                  </button>
                </div>
              </div>
              <b className="num">{toman(l.product.price * l.qty)}</b>
            </div>
          );
        })}
      </div>

      <div className="totals" style={{ marginBlockStart: 'var(--s5)' }}>
        {missing > 0 ? (
          <>
            <span>{toman(missing)} دیگر بخرید تا ارسال رایگان شود.</span>
            <div className="progress"><i style={{ width: `${pct}%` }} /></div>
          </>
        ) : (
          <span style={{ color: 'var(--ok)' }}>ارسال این سفارش رایگان است.</span>
        )}
        <div className="row between"><span>جمع کالاها</span><b className="num">{toman(subtotal)}</b></div>
        <div className="row between"><span>ارسال</span><b className="num">{shipping ? toman(shipping) : 'رایگان'}</b></div>
        <div className="row between sum"><span>قابل پرداخت</span><b className="num">{toman(subtotal + shipping)}</b></div>
      </div>

      <button
        className="btn btn-primary btn-block"
        style={{ marginBlockStart: 'var(--s4)' }}
        onClick={() => toast('اینجا به درگاه پرداخت وصل می‌شود')}
      >
        ادامهٔ خرید و پرداخت
      </button>
      <p className="muted" style={{ fontSize: 'var(--t-xs)', textAlign: 'center', marginBlockStart: 'var(--s3)' }}>
        پرداخت امن با کارت‌های شتاب · تعویض سایز رایگان تا ۷ روز
      </p>
    </div>
  );
}
