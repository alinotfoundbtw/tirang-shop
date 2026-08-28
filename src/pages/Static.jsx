import { useState } from 'react';
import { Link } from 'react-router-dom';
import { faqs, products } from '../data/products';
import ProductCard from '../components/ProductCard';
import QuickView from '../components/QuickView';
import { EmptyState } from '../components/States';
import { useShop } from '../lib/store';
import { useSeo, faqLd } from '../lib/seo';

export function Faq() {
  useSeo({
    title: 'راهنما و جدول اندازه',
    description: 'انتخاب سایز، تعویض رایگان، زمان ارسال، شست‌وشو و چاپ سفارشی.',
    path: '/faq',
    jsonLd: faqLd(faqs),
  });

  return (
    <div className="wrap" style={{ paddingBlock: 'var(--s5)', maxWidth: 720 }}>
      <p className="eyebrow">راهنما</p>
      <h1 style={{ fontSize: 'var(--t-h1)', marginBlockEnd: 'var(--s5)' }}>سؤال‌های پرتکرار</h1>

      {/* Five columns of nowrap numbers do not fit a 360px screen — let them scroll. */}
      <div className="table-scroll bleed" style={{ marginBlockEnd: 'var(--s6)' }}>
        <table className="sizes">
          <caption className="muted" style={{ textAlign: 'start', fontSize: 'var(--t-xs)', paddingBlockEnd: 'var(--s2)' }}>
            اندازه‌ها بر حسب سانتی‌متر و روی لباس خوابیده گرفته شده‌اند.
          </caption>
          <thead>
            <tr><th>سایز</th><th>دور سینه</th><th>قد</th><th>سرشانه</th><th>مناسب قد</th></tr>
          </thead>
          <tbody>
            {[
              ['S', '۹۶', '۶۸', '۴۴', 'تا ۱۶۸'],
              ['M', '۱۰۲', '۷۰', '۴۶', '۱۶۸ تا ۱۷۶'],
              ['L', '۱۰۸', '۷۲', '۴۸', '۱۷۶ تا ۱۸۴'],
              ['XL', '۱۱۴', '۷۴', '۵۰', '۱۸۴ تا ۱۹۰'],
              ['XXL', '۱۲۰', '۷۶', '۵۲', 'بالای ۱۹۰'],
            ].map((r) => (
              <tr key={r[0]}>
                <td><b>{r[0]}</b></td>
                {r.slice(1).map((c, i) => <td key={i} className="num">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {faqs.map((f) => (
        <details key={f.q} className="accordion">
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}

      <p style={{ marginBlockStart: 'var(--s5)' }}>
        جوابت اینجا نبود؟ <Link to="/ask" className="link-more">از مشاور بپرس</Link>
      </p>
    </div>
  );
}

export function Wishlist() {
  const { wish } = useShop();
  const [quick, setQuick] = useState(null);
  useSeo({ title: 'علاقه‌مندی‌ها', noindex: true, path: '/wishlist' });

  const list = wish.map((id) => products.find((p) => p.id === id)).filter(Boolean);

  return (
    <div className="wrap" style={{ paddingBlock: 'var(--s5)' }}>
      <h1 style={{ fontSize: 'var(--t-h1)', marginBlockEnd: 'var(--s5)' }}>علاقه‌مندی‌ها</h1>
      {list.length === 0 ? (
        <EmptyState
          title="هنوز چیزی نشان نکرده‌ای"
          body="قلب گوشهٔ هر تیشرت را بزن تا اینجا بماند."
          action={<Link to="/products" className="btn btn-primary">دیدن تیشرت‌ها</Link>}
        />
      ) : (
        <div className="grid-products">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} eager={i < 4} onQuickView={setQuick} />
          ))}
        </div>
      )}
      {quick && <QuickView product={quick} onClose={() => setQuick(null)} />}
    </div>
  );
}

export function NotFound() {
  useSeo({ title: 'صفحه پیدا نشد', noindex: true });
  return (
    <div className="wrap state" style={{ minHeight: '60dvh' }}>
      <svg width="120" height="100" viewBox="0 0 86 72" aria-hidden="true">
        <path
          d="M31 6 L14 14 L6 30 L18 36 L18 66 L68 66 L68 36 L80 30 L72 14 L55 6 Q43 18 31 6 Z"
          fill="none" stroke="var(--line-strong)" strokeWidth="2.5" strokeLinejoin="round"
        />
        <text x="43" y="52" textAnchor="middle" fontFamily="var(--font-display)" fontSize="20" fontWeight="700" fill="var(--cherry)">۴۰۴</text>
      </svg>
      <h2>این صفحه دوخته نشده</h2>
      <p>آدرسی که دنبالش بودی وجود ندارد یا جابه‌جا شده.</p>
      <Link to="/" className="btn btn-primary">برگرد به خانه</Link>
    </div>
  );
}
