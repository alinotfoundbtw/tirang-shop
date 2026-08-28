import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { search, searchFaq } from '../lib/rag';
import { trapFocus } from '../lib/focus';
import { categories } from '../data/products';
import { toman, fa } from '../lib/format';

/**
 * The header magnifier used to be a link to /products, which is not a search —
 * it is a page of everything. This opens in place and answers as you type.
 *
 * Retrieval is in memory and costs under a millisecond, so there is no debounce
 * and no spinner: results land on the same frame as the keystroke.
 */

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const art = {
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  corner: <path d="M9 5 4 10l5 5M4 10h11a5 5 0 0 1 5 5v3" />,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.6 2.6 0 1 1 3.2 2.5c-.5.2-.7.6-.7 1.1v.6" /><circle cx="12" cy="17" r="0.7" fill="currentColor" stroke="none" /></>,
};

export default function QuickSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!q.trim()) return { products: [], faq: null };
    return { products: search(q, { limit: 6 }).hits.map((h) => h.product), faq: searchFaq(q) };
  }, [q]);

  const rows = results.products;

  useEffect(() => setCursor(0), [q]);

  useEffect(() => {
    if (!open) return undefined;
    // Focus after paint, or the panel's own open animation eats the caret.
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, rows.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const release = trapFocus(panelRef.current);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      release();
    };
  }, [open, rows.length]);

  const close = () => { setOpen(false); setQ(''); };

  const go = (to) => { close(); navigate(to); };

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    // Enter on a highlighted row opens that product; otherwise, all results.
    if (rows[cursor]) go(`/p/${rows[cursor].slug}`);
    else go(`/products?q=${encodeURIComponent(term)}`);
  };

  return (
    <>
      <button className="icon-btn" aria-label="جست‌وجو" aria-expanded={open} onClick={() => setOpen(true)}>
        <Icon d={art.search} />
      </button>

      {open && (
        <div className="qs-scrim" onClick={(e) => e.target === e.currentTarget && close()}>
          <div className="qs" ref={panelRef} role="dialog" aria-modal="true" aria-label="جست‌وجو در فروشگاه">
            <form className="qs-bar" onSubmit={submit}>
              <Icon d={art.search} size={19} />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                placeholder="تیشرت مشکی اورسایز، پک، بچگانه…"
                aria-label="عبارت جست‌وجو"
              />
              <button type="button" className="qs-close" onClick={close} aria-label="بستن">
                <Icon d={art.close} size={18} />
              </button>
            </form>

            <div className="qs-body">
              {!q.trim() && (
                <>
                  <p className="qs-head">دسته‌ها</p>
                  <div className="qs-cats">
                    {categories.map((c) => (
                      <button key={c.slug} className="chip" onClick={() => go(`/products?cat=${c.slug}`)}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {q.trim() && rows.length === 0 && (
                <p className="qs-empty">
                  چیزی با «{q.trim()}» پیدا نشد. رنگ، اندازه یا بودجه را امتحان کنید — یا از{' '}
                  <Link to="/ask" onClick={close} className="link-more">مشاور خرید</Link> بپرسید.
                </p>
              )}

              {rows.length > 0 && (
                <>
                  <p className="qs-head">محصولات</p>
                  <ul className="qs-list">
                    {rows.map((p, i) => (
                      <li key={p.id}>
                        <Link
                          to={`/p/${p.slug}`}
                          onClick={close}
                          className={i === cursor ? 'on' : ''}
                          onMouseEnter={() => setCursor(i)}
                        >
                          <img src={p.colors[0].photos[0]} alt="" loading="lazy" decoding="async" />
                          <span className="qs-name">
                            <b>{p.name}</b>
                            <small>{p.fit} · {p.colors.map((c) => c.name).slice(0, 3).join('، ')}</small>
                          </span>
                          <span className="qs-price num">{toman(p.price, { unit: false })}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {results.faq && (
                <>
                  <p className="qs-head">راهنما</p>
                  <Link to="/faq" onClick={close} className="qs-faq">
                    <Icon d={art.help} size={18} />
                    <span>
                      <b>{results.faq.doc.q}</b>
                      <small>{results.faq.doc.a.slice(0, 96)}…</small>
                    </span>
                  </Link>
                </>
              )}

              {rows.length > 0 && (
                <button className="qs-all" onClick={() => go(`/products?q=${encodeURIComponent(q.trim())}`)}>
                  دیدن همهٔ نتایج «{q.trim()}»
                  <Icon d={art.corner} size={16} />
                </button>
              )}
            </div>

            <p className="qs-hint">
              <kbd>↑</kbd><kbd>↓</kbd> برای جابه‌جایی · <kbd>Enter</kbd> برای باز کردن · <kbd>Esc</kbd> برای بستن
            </p>
          </div>
        </div>
      )}
    </>
  );
}
