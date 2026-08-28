import { useState } from 'react';
import { Link } from 'react-router-dom';
import { categories, products } from '../data/products';
import Hero from '../components/Hero';
import CategoryMark from '../components/CategoryMark';
import ProductCard from '../components/ProductCard';
import QuickView from '../components/QuickView';
import { reviews } from '../data/reviews';
import { useSeo } from '../lib/seo';
import { fa } from '../lib/format';

/** A horizontal strip of products. Scroll-snap, never auto-advancing —
 *  a rail that moves on its own is a rail you cannot read.
 *
 *  Below four items there is nothing to scroll, and a rail holding two cards
 *  reads as a broken rail rather than a short one. Those fall back to the
 *  ordinary grid, which looks deliberate at any count. */
const RAIL_MIN = 4;

function Rail({ title, note, to, items, onQuickView, eager = false }) {
  if (!items?.length) return null;
  const scrolls = items.length >= RAIL_MIN;
  return (
    <section className="section wrap">
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          {note && <p className="section-note">{note}</p>}
        </div>
        <Link to={to} className="link-more">همه</Link>
      </div>
      <div className={scrolls ? 'rail' : 'grid-products'}>
        {items.map((p, i) => (
          <ProductCard key={p.id} product={p} eager={eager && i < 2} onQuickView={onQuickView} />
        ))}
      </div>
      {scrolls && <p className="rail-hint">{fa(items.length)} مدل — برای دیدن بقیه بکشید</p>}
    </section>
  );
}

/** A few review lines, pulled from the same sample data the product pages
 *  show. Labelled there and labelled here. */
function VoicesStrip() {
  const picks = reviews.filter((r) => r.rating === 5).slice(0, 6);
  return (
    <section className="section wrap">
      <div className="section-head">
        <div>
          <h2>مشتری‌ها چه گفتند</h2>
          <p className="section-note">نمونه — برای نمایش قالب</p>
        </div>
      </div>
      <div className="rail voices">
        {picks.map((r) => {
          const p = products.find((x) => x.id === r.product);
          return (
            <blockquote className="voice" key={r.id}>
              <p>{r.body}</p>
              <footer>
                <span className="voice-avatar" aria-hidden="true">{r.name.trim()[0]}</span>
                <span>
                  <b>{r.name}</b>
                  {p && <small>{p.name}</small>}
                </span>
              </footer>
            </blockquote>
          );
        })}
      </div>
    </section>
  );
}

export default function Home() {
  useSeo({
    title: 'تیشرت پایه و طرح‌دار',
    description: 'تیشرت اورسایز، پایه، طرح‌دار و بچگانه با نخ پنبهٔ ایرانی. تعویض سایز رایگان تا ۷ روز.',
    path: '/',
  });

  const [quick, setQuick] = useState(null);

  /* Rails carry the whole catalog rather than a handful. They are scroll-snap
     strips, not carousels — nothing here advances on its own, so a long rail
     costs a swipe, not attention. `new` first inside each so the rail opens on
     something the shopper has not seen. */
  const byNewThenSales = (a, b) => Number(b.new) - Number(a.new) || b.sales - a.sales;
  const best = [...products].sort((a, b) => b.sales - a.sales);
  const fresh = [...products].sort(byNewThenSales);
  const affordable = products.filter((p) => p.price <= 500000).sort(byNewThenSales);
  const loose = products.filter((p) => String(p.fit).includes('اورسایز') || p.tags.includes('اورسایز')).sort(byNewThenSales);
  const packs = products.filter((p) => p.category === 'pack' || p.tags.includes('پک') || p.tags.includes('ست'));
  const forThem = products.filter((p) => p.category === 'kids' || p.category === 'women').sort(byNewThenSales);

  return (
    <>
      <Hero />

      <section className="section wrap">
        <div className="section-head"><h2>دسته‌ها</h2></div>
        <div className="cats">
          {categories.map((c) => (
            <Link key={c.slug} to={`/products?cat=${c.slug}`} className="cat">
              <span className="cat-mark"><CategoryMark slug={c.slug} size={24} /></span>
              <b>{c.name}</b>
              <span className="cat-note">{c.note}</span>
              <span className="cat-count num">
                {fa(products.filter((p) => p.category === c.slug).length)} مدل
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Rail
        title="پرفروش‌ها"
        note="به ترتیب چیزی که بیشتر از همه فروخته"
        to="/products?sort=best"
        items={best}
        onQuickView={setQuick}
        eager
      />

      <section className="section wrap">
        <div
          style={{
            background: 'var(--ink)', color: 'var(--paper)',
            borderRadius: 'var(--r-lg)', padding: 'var(--s6) var(--s5)',
            display: 'grid', gap: 'var(--s4)',
          }}
        >
          <p className="eyebrow" style={{ color: 'rgba(255,255,255,.6)' }}>مشاور خرید</p>
          <h2 style={{ fontSize: 'var(--t-h1)', maxWidth: '22ch' }}>
            قدت را بگو، بگو چه تن‌خوری دوست داری.
          </h2>
          <p style={{ opacity: 0.8, maxWidth: '46ch' }}>
            «۱۸۰ سانتم، تیشرت گشاد مشکی زیر ۶۰۰ تومن» را بنویس. از بین موجودی واقعی، آن‌هایی که
            سایز و رنگش هست را با دلیل نشانت می‌دهد.
          </p>
          <div>
            <Link to="/ask" className="btn" style={{ background: 'var(--paper)', color: 'var(--ink)' }}>
              بپرس
            </Link>
          </div>
        </div>
      </section>

      <Rail
        title="تازه رسیده"
        note="آخرین چیزهایی که به کمد اضافه شد"
        to="/products?sort=new"
        items={fresh}
        onQuickView={setQuick}
      />

      <Rail
        title="زیر ۵۰۰ هزار تومان"
        note="همان پارچه، قیمت کمتر"
        to="/products?sort=cheap"
        items={affordable}
        onQuickView={setQuick}
      />

      <Rail
        title="گشاد و راحت"
        note="تن‌خور آزاد، شانهٔ افتاده"
        to="/products?fit=اورسایز"
        items={loose}
        onQuickView={setQuick}
      />

      <Rail
        title="پک‌ها و ست‌ها"
        note="دو یا سه تیشرت، ارزان‌تر از جدا"
        to="/products?cat=pack"
        items={packs}
        onQuickView={setQuick}
      />

      <Rail
        title="زنانه و بچگانه"
        note="برش زنانه و نخ نرم بچگانه"
        to="/products?cat=women"
        items={forThem}
        onQuickView={setQuick}
      />

      <VoicesStrip />

      {quick && <QuickView product={quick} onClose={() => setQuick(null)} />}
    </>
  );
}
