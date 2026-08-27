import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { products, categories } from '../data/products';
import { search } from '../lib/rag';
import ProductCard from '../components/ProductCard';
import QuickView from '../components/QuickView';
import { SkeletonGrid, ErrorState, EmptyState } from '../components/States';
import { useAsync } from '../lib/store';
import { useSeo, breadcrumbLd } from '../lib/seo';
import { fa, toman } from '../lib/format';

const SORTS = [
  ['best', 'پرفروش‌ترین'],
  ['new', 'جدیدترین'],
  ['cheap', 'ارزان‌ترین'],
  ['exp', 'گران‌ترین'],
];

const FITS = ['اورسایز', 'رگولار', 'اسلیم'];

export default function Products() {
  const [params, setParams] = useSearchParams();
  const cat = params.get('cat') || '';
  const tag = params.get('tag') || '';
  const q = params.get('q') || '';
  const color = params.get('color') || '';
  const fit = params.get('fit') || '';
  const sort = params.get('sort') || 'best';
  const [draft, setDraft] = useState(q);
  const [quick, setQuick] = useState(null);

  const catName = categories.find((c) => c.slug === cat)?.name;
  const heading = q ? `جست‌وجوی «${q}»` : catName || tag || 'همهٔ تیشرت‌ها';

  useSeo({
    title: heading,
    description: `${heading} — تیشرت با نخ پنبهٔ ایرانی، رنگ‌های واقعی و تعویض سایز رایگان.`,
    path: '/products',
    noindex: Boolean(q),
    jsonLd: breadcrumbLd([
      { name: 'خانه', path: '/' },
      { name: heading, path: '/products' },
    ]),
  });

  const palette = useMemo(() => {
    const seen = new Map();
    products.forEach((p) => p.colors.forEach((c) => seen.set(c.name, c.hex)));
    return [...seen.entries()];
  }, []);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const { loading, error, data, retry } = useAsync(() => {
    let list = products;
    if (cat) list = list.filter((p) => p.category === cat);
    if (tag) list = list.filter((p) => p.tags.includes(tag));
    if (fit) list = list.filter((p) => p.fit.includes(fit));
    if (color) list = list.filter((p) => p.colors.some((c) => c.name === color));
    if (q) {
      const hits = search(q, { limit: 40 }).hits;
      const order = new Map(hits.map((h, i) => [h.product.id, i]));
      list = list.filter((p) => order.has(p.id)).sort((a, b) => order.get(a.id) - order.get(b.id));
      if (sort === 'best') return list;
    }
    const by = {
      best: (a, b) => b.sales - a.sales,
      new: (a, b) => Number(b.new) - Number(a.new) || b.sales - a.sales,
      cheap: (a, b) => a.price - b.price,
      exp: (a, b) => b.price - a.price,
    }[sort];
    return [...list].sort(by);
  }, [cat, tag, q, sort, color, fit]);

  const priceHint = useMemo(() => {
    if (!data?.length) return null;
    const prices = data.map((p) => p.price);
    return `${toman(Math.min(...prices), { unit: false })} تا ${toman(Math.max(...prices))}`;
  }, [data]);

  const active = cat || tag || color || fit || q;

  return (
    <div className="wrap" style={{ paddingBlock: 'var(--s5)' }}>
      <p className="eyebrow">فروشگاه</p>
      <h1 style={{ fontSize: 'var(--t-h1)', marginBlock: 'var(--s2) var(--s4)' }}>{heading}</h1>

      <div className="row" style={{ gap: 'var(--s2)', marginBlockEnd: 'var(--s4)' }}>
        <input
          className="field"
          placeholder="تیشرت مشکی اورسایز، پک، بچگانه…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setParam('q', draft.trim())}
          aria-label="جست‌وجو در محصولات"
        />
        <button className="btn btn-primary" onClick={() => setParam('q', draft.trim())}>بگرد</button>
      </div>

      <div className="suggestions" style={{ marginBlockEnd: 'var(--s2)' }}>
        {categories.map((c) => (
          <button key={c.slug} className="chip" aria-pressed={cat === c.slug} onClick={() => setParam('cat', cat === c.slug ? '' : c.slug)}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="suggestions" style={{ marginBlockEnd: 'var(--s2)' }}>
        {FITS.map((f) => (
          <button key={f} className="chip" aria-pressed={fit === f} onClick={() => setParam('fit', fit === f ? '' : f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="row" style={{ gap: 'var(--s2)', marginBlockEnd: 'var(--s4)', flexWrap: 'wrap' }}>
        <span className="muted" style={{ fontSize: 'var(--t-xs)' }}>رنگ:</span>
        {palette.map(([name, hex]) => (
          <button
            key={name}
            className="sw"
            style={{ background: hex }}
            aria-pressed={color === name}
            aria-label={`فیلتر رنگ ${name}`}
            title={name}
            onClick={() => setParam('color', color === name ? '' : name)}
          />
        ))}
        {active && (
          <button className="btn-quiet" style={{ fontSize: 'var(--t-xs)' }} onClick={() => setParams({}, { replace: true })}>
            پاک‌کردن فیلترها
          </button>
        )}
      </div>

      <div className="row between" style={{ marginBlockEnd: 'var(--s4)', flexWrap: 'wrap' }}>
        <span className="muted" style={{ fontSize: 'var(--t-sm)' }}>
          {loading ? 'در حال شمردن…' : `${fa(data?.length ?? 0)} مدل${priceHint ? ` · ${priceHint}` : ''}`}
        </span>
        <select className="field" style={{ width: 'auto' }} value={sort} onChange={(e) => setParam('sort', e.target.value)} aria-label="ترتیب نمایش">
          {SORTS.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {loading && <SkeletonGrid count={8} />}
      {error && <ErrorState message={error} onRetry={retry} />}
      {!loading && !error && data.length === 0 && (
        <EmptyState
          title="با این فیلترها چیزی نداریم"
          body="یک فیلتر را بردارید، یا بگذارید مشاور با توضیح خودتان بگردد."
          action={<Link to="/ask" className="btn btn-primary">پرسیدن از مشاور</Link>}
        />
      )}
      {!loading && !error && data.length > 0 && (
        <div className="grid-products">
          {data.map((p, i) => (
            <ProductCard key={p.id} product={p} eager={i < 4} onQuickView={setQuick} />
          ))}
        </div>
      )}

      {quick && <QuickView product={quick} onClose={() => setQuick(null)} />}
    </div>
  );
}
