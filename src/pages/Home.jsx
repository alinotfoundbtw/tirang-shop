import { useState } from 'react';
import { Link } from 'react-router-dom';
import { categories, products } from '../data/products';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import QuickView from '../components/QuickView';
import { useSeo } from '../lib/seo';

export default function Home() {
  useSeo({
    title: 'تیشرت پایه و طرح‌دار',
    description: 'تیشرت اورسایز، پایه، طرح‌دار و بچگانه با نخ پنبهٔ ایرانی. تعویض سایز رایگان تا ۷ روز.',
    path: '/',
  });

  const [quick, setQuick] = useState(null);

  const fresh = products.filter((p) => p.new).slice(0, 6);
  const best = [...products].sort((a, b) => b.sales - a.sales).slice(0, 4);

  return (
    <>
      <Hero />

      <section className="section wrap">
        <div className="section-head"><h2>دسته‌ها</h2></div>
        <div className="cats">
          {categories.map((c) => (
            <Link key={c.slug} to={`/products?cat=${c.slug}`} className="cat">
              <b>{c.name}</b>
              <span>{c.note}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section wrap">
        <div className="section-head">
          <h2>پرفروش‌ها</h2>
          <Link to="/products" className="link-more">همه</Link>
        </div>
        <div className="grid-products">
          {best.map((p, i) => (
            <ProductCard key={p.id} product={p} eager={i < 2} onQuickView={setQuick} />
          ))}
        </div>
      </section>

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

      {fresh.length > 0 && (
        <section className="section wrap">
          <div className="section-head">
            <h2>تازه رسیده</h2>
            <Link to="/products?sort=new" className="link-more">بیشتر</Link>
          </div>
          <div className="rail">
            {fresh.map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={setQuick} />
            ))}
          </div>
        </section>
      )}

      {quick && <QuickView product={quick} onClose={() => setQuick(null)} />}
    </>
  );
}
