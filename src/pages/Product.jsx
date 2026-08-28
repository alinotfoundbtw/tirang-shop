import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { products, categories } from '../data/products';
import Gallery from '../components/Gallery';
import ProductCard from '../components/ProductCard';
import Reviews from '../components/Reviews';
import { reviewSummary } from '../data/reviews';
import { ColorPicker, SizePicker, SizeFinder, useVariant } from '../components/Buy';
import { Loader, EmptyState } from '../components/States';
import { useShop, useAsync } from '../lib/store';
import { useSeo, productLd, breadcrumbLd } from '../lib/seo';
import { toman, fa, off } from '../lib/format';

const MEASURES = {
  S: ['۹۶', '۶۸', '۴۴'],
  M: ['۱۰۲', '۷۰', '۴۶'],
  L: ['۱۰۸', '۷۲', '۴۸'],
  XL: ['۱۱۴', '۷۴', '۵۰'],
  XXL: ['۱۲۰', '۷۶', '۵۲'],
};

export default function Product() {
  const { slug } = useParams();
  const { loading, data: p } = useAsync(() => products.find((x) => x.slug === slug) ?? null, [slug], { delay: 260 });

  if (loading) return <Loader />;
  if (!p)
    return (
      <div className="wrap">
        <EmptyState
          title="این مدل دیگر نیست"
          body="شاید اسمش عوض شده یا از فروش درآمده."
          action={<Link to="/products" className="btn btn-primary">دیدن بقیه</Link>}
        />
      </div>
    );

  return <Detail key={p.id} p={p} />;
}

function Detail({ p }) {
  const { dispatch, toast, wish, toggleWish, markSeen, seen } = useShop();
  const { ci, color, size, setSize, pickColor, left, inStock } = useVariant(p);
  const [sticky, setSticky] = useState(false);
  const buyRef = useRef(null);

  useEffect(() => markSeen(p.id), [p.id, markSeen]);

  // The floating bar appears only once the real button has scrolled away.
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSticky(!e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* One rating on the page: the same summary feeds the line under the title,
     the section at the bottom and the structured data. Declared above useSeo
     because that call reads it while building the JSON-LD. */
  const rating = reviewSummary(p.id);

  useSeo({
    title: p.name,
    description: p.bio.slice(0, 155),
    image: p.colors[0].photos[0],
    path: `/p/${p.slug}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        productLd(p, `${window.location.origin}/p/${p.slug}`, rating),
        breadcrumbLd([
          { name: 'خانه', path: '/' },
          { name: categories.find((c) => c.slug === p.category)?.name || 'محصولات', path: `/products?cat=${p.category}` },
          { name: p.name, path: `/p/${p.slug}` },
        ]),
      ],
    },
  });

  const discount = off(p.price, p.oldPrice);
  const liked = wish.includes(p.id);
  const related = products.filter((x) => x.id !== p.id && (x.category === p.category || x.tags.some((t) => p.tags.includes(t)))).slice(0, 4);
  const recent = seen.filter((id) => id !== p.id).map((id) => products.find((x) => x.id === id)).filter(Boolean).slice(0, 4);
  const sizeRows = p.sizeLabels ? [] : p.sizes.filter((s) => MEASURES[s]);

  const add = () => {
    dispatch({ type: 'add', id: p.id, color: color.name, size });
    toast(`${p.name} — ${color.name}، ${p.sizeLabels?.[size] ?? size} به سبد اضافه شد`);
  };

  return (
    <div className="wrap">
      <nav aria-label="مسیر" className="muted" style={{ fontSize: 'var(--t-xs)', paddingBlockStart: 'var(--s4)' }}>
        <Link to="/">خانه</Link> ← <Link to={`/products?cat=${p.category}`}>{categories.find((c) => c.slug === p.category)?.name}</Link> ← <span>{p.name}</span>
      </nav>

      <div className="pdp">
        <Gallery photos={color.photos} alt={`${p.name} — رنگ ${color.name}`} />

        <div className="stack" style={{ gap: 'var(--s4)' }}>
          <div className="row" style={{ gap: 'var(--s2)' }}>
            {p.new && <span className="badge badge-new">جدید</span>}
            {discount > 0 && <span className="badge badge-sale">{fa(discount)}٪ تخفیف</span>}
            <span className="badge">{p.fit}</span>
          </div>

          <div>
            <h1 style={{ fontSize: 'var(--t-h1)' }}>{p.name}</h1>
            <p className="muted" style={{ fontSize: 'var(--t-sm)' }}>{p.subtitle}</p>
          </div>

          <p className="muted" style={{ fontSize: 'var(--t-sm)' }}>
            {rating && (
              <>
                <a href="#reviews" className="link-more">
                  ⭐ {fa(rating.average.toFixed(1).replace('.', '٫'))} ({fa(rating.count)} نظر)
                </a>
                {' · '}
              </>
            )}
            {fa(p.sales)} خرید · {p.model}
          </p>

          <div className="price-now num">
            {toman(p.price)}
            {p.oldPrice && <s>{toman(p.oldPrice, { unit: false })}</s>}
          </div>

          <ColorPicker product={p} ci={ci} onPick={pickColor} />
          <SizePicker product={p} color={color} size={size} onPick={setSize} />
          <SizeFinder product={p} onApply={setSize} />

          <div className="buybar" ref={buyRef}>
            <button className="btn btn-primary grow" onClick={add} disabled={!inStock}>
              {inStock ? 'افزودن به سبد' : p.stock === 0 ? 'سفارش چاپ اختصاصی' : 'این ترکیب موجود نیست'}
            </button>
            <button
              className="btn btn-ghost"
              aria-pressed={liked}
              onClick={() => toggleWish(p.id)}
              aria-label={liked ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
            >
              {liked ? '♥' : '♡'}
            </button>
          </div>

          <p className="muted" style={{ fontSize: 'var(--t-xs)' }}>
            {inStock
              ? `ارسال ${left > 3 ? 'یک تا دو' : 'دو تا سه'} روز کاری · تعویض سایز رایگان تا ۷ روز`
              : `آماده‌سازی حدود ${fa(p.days)} روز کاری`}
          </p>

          <div style={{ marginBlockStart: 'var(--s3)' }}>
            <details className="accordion" open>
              <summary>مشخصات</summary>
              <dl className="spec">
                <dt>جنس</dt><dd>{p.fabric}</dd>
                <dt>وزن پارچه</dt><dd className="num">{fa(p.gsm)} گرم بر متر مربع</dd>
                <dt>تن‌خور</dt><dd>{p.fit}</dd>
                <dt>مدل</dt><dd>{p.model}</dd>
                <dt>نگهداری</dt><dd>{p.care}</dd>
              </dl>
            </details>

            <details className="accordion">
              <summary>توضیح کامل</summary>
              <p>{p.bio}</p>
            </details>

            {sizeRows.length > 0 && (
              <details className="accordion" id="size-table">
                <summary>جدول اندازه (سانتی‌متر)</summary>
                <div className="table-scroll">
                  <table className="sizes">
                    <thead>
                      <tr><th>سایز</th><th>دور سینه</th><th>قد</th><th>سرشانه</th></tr>
                    </thead>
                    <tbody>
                      {sizeRows.map((s) => (
                        <tr key={s}>
                          <td><b>{s}</b></td>
                          {MEASURES[s].map((m, i) => (
                            <td key={i} className="num">{m}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>اندازه‌ها روی لباس خوابیده گرفته شده‌اند، نه روی بدن. حدود یک سانت خطا طبیعی است.</p>
              </details>
            )}

            <details className="accordion">
              <summary>ارسال و مرجوعی</summary>
              <p>
                تهران یک تا دو روز کاری، شهرستان دو تا چهار روز. تعویض سایز تا هفت روز رایگان است،
                به شرطی که تیشرت پوشیده و شسته نشده باشد و برچسبش سر جایش باشد.
              </p>
            </details>
          </div>
        </div>
      </div>

      <Reviews product={p} />

      <section className="section">
        <div className="section-head"><h2>شبیه همین</h2></div>
        <div className="grid-products">
          {related.map((x) => (
            <ProductCard key={x.id} product={x} />
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="section">
          <div className="section-head"><h2>اخیراً دیدی</h2></div>
          <div className="rail">
            {recent.map((x) => (
              <ProductCard key={x.id} product={x} />
            ))}
          </div>
        </section>
      )}

      <div className={`buy-sticky ${sticky ? 'show' : ''}`}>
        <div className="grow" style={{ minWidth: 0 }}>
          <b style={{ fontSize: 'var(--t-sm)' }}>{color.name} · {p.sizeLabels?.[size] ?? size}</b>
          <div className="num" style={{ fontSize: 'var(--t-sm)', color: 'var(--wine)' }}>{toman(p.price)}</div>
        </div>
        <button className="btn btn-primary" onClick={add} disabled={!inStock}>
          {inStock ? 'افزودن به سبد' : 'ناموجود'}
        </button>
      </div>
    </div>
  );
}
