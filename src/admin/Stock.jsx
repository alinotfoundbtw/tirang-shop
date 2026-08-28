import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../data/products';
import { updateProduct } from '../lib/catalog';
import { useCatalog } from '../lib/useCatalog';
import { normalize } from '../lib/rag';
import { useShop } from '../lib/store';
import { fa } from '../lib/format';

/**
 * مدیریت موجودی — every colour and size in one grid.
 *
 * Stock is the thing that changes daily, and doing it through the product
 * form means opening a fifteen-field page to change one number. Here the
 * whole shop is one table you can walk with a keyboard.
 *
 * Nothing is written as you type. Edits collect in a draft and land together
 * when you press save, which is what makes fast editing safe: a mis-typed
 * number is undone by discarding, not by remembering what it used to be.
 * The bar at the bottom exists so you can never forget you have unsaved work.
 */

const LOW = 3; // at or below this, a size is worth restocking before it is gone

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const art = {
  save: <><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v5h7M8 20v-6h8v6" /></>,
  undo: <path d="M4 10a8 8 0 1 1 1.2 5M4 5v5h5" />,
  warn: <><path d="M12 4 2.5 20h19z" /><path d="M12 10v4" /><circle cx="12" cy="17" r="0.7" fill="currentColor" stroke="none" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
};

const FILTERS = [
  ['all', 'همه'],
  ['low', 'رو به اتمام'],
  ['out', 'تمام‌شده'],
];

export default function Stock() {
  const products = useCatalog();
  const { toast } = useShop();
  const [draft, setDraft] = useState({});   // { productId: { colourName: { size: value } } }
  const [filter, setFilter] = useState('all');
  const [cat, setCat] = useState('');
  const [q, setQ] = useState('');

  /** What a cell shows: the edit if there is one, otherwise what is stored. */
  const valueOf = (p, colour, size) => {
    const edited = draft[p.id]?.[colour.name]?.[size];
    return edited !== undefined ? edited : (colour.stock[size] ?? 0);
  };

  const setCell = (p, colour, size, raw) => {
    // Keep it a string while typing so the field can be emptied, and clamp
    // only what is committed.
    const clean = String(raw).replace(/[^\d۰-۹]/g, '');
    setDraft((d) => ({
      ...d,
      [p.id]: {
        ...d[p.id],
        [colour.name]: { ...d[p.id]?.[colour.name], [size]: clean },
      },
    }));
  };

  const asNumber = (v) => Math.max(0, Number(normalize(String(v))) || 0);

  /** Steppers, for the common case: one sold, one arrived. */
  const bump = (p, colour, size, by) =>
    setCell(p, colour, size, String(Math.max(0, asNumber(valueOf(p, colour, size)) + by)));

  /** Sets every size of one colour at once — a delivery arrives as a batch. */
  const fillRow = (p, colour) => {
    const raw = window.prompt(`موجودی همهٔ سایزهای «${colour.name}» چند شود؟`, '');
    if (raw === null) return;
    const n = String(asNumber(raw));
    setDraft((d) => ({
      ...d,
      [p.id]: {
        ...d[p.id],
        [colour.name]: Object.fromEntries(p.sizes.map((s) => [s, n])),
      },
    }));
  };

  const dirtyIds = Object.keys(draft);
  const dirtyCells = dirtyIds.reduce(
    (n, id) => n + Object.values(draft[id]).reduce((m, sizes) => m + Object.keys(sizes).length, 0),
    0
  );

  const save = () => {
    let saved = 0;
    let failed = '';
    for (const id of dirtyIds) {
      const p = products.find((x) => x.id === id);
      if (!p) continue;
      const colors = p.colors.map((c) => ({
        ...c,
        stock: Object.fromEntries(
          p.sizes.map((s) => [s, Math.max(0, Number(normalize(String(valueOf(p, c, s)))) || 0)])
        ),
      }));
      const total = colors.reduce((sum, c) => sum + Object.values(c.stock).reduce((a, b) => a + b, 0), 0);
      const res = updateProduct(id, { colors, stock: total });
      if (res.ok) saved += 1;
      else failed = res.error;
    }
    if (failed) return toast(failed, 'warn');
    setDraft({});
    toast(`موجودی ${fa(saved)} محصول ذخیره شد`);
  };

  const rows = useMemo(() => {
    const needle = normalize(q);
    return products.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (needle && !normalize(`${p.name} ${p.subtitle} ${p.tags.join(' ')}`).includes(needle)) return false;
      if (filter === 'out') return p.colors.some((c) => p.sizes.some((s) => (c.stock[s] ?? 0) === 0));
      if (filter === 'low') {
        return p.colors.some((c) => p.sizes.some((s) => {
          const n = c.stock[s] ?? 0;
          return n > 0 && n <= LOW;
        }));
      }
      return true;
    });
  }, [products, filter, cat, q]);

  const units = products.reduce((n, p) => n + p.stock, 0);
  const outCombos = products.reduce(
    (n, p) => n + p.colors.reduce((m, c) => m + p.sizes.filter((s) => (c.stock[s] ?? 0) === 0).length, 0),
    0
  );
  const lowCombos = products.reduce(
    (n, p) => n + p.colors.reduce((m, c) => m + p.sizes.filter((s) => {
      const v = c.stock[s] ?? 0;
      return v > 0 && v <= LOW;
    }).length, 0),
    0
  );

  return (
    <>
      <h1 style={{ fontSize: 'var(--t-h1)' }}>مدیریت موجودی</h1>
      <p className="muted" style={{ fontSize: 'var(--t-sm)' }}>
        هر رنگ و هر سایز، در یک جدول. عددها را عوض کنید و آخرش یک‌جا ذخیره کنید.
      </p>

      <div className="kpis" style={{ marginBlockStart: 'var(--s4)' }}>
        <div className="kpi"><small>کل موجودی</small><b className="num">{fa(units)}</b><span className="delta muted">عدد در انبار</span></div>
        <div className="kpi"><small>ترکیب تمام‌شده</small><b className="num">{fa(outCombos)}</b><span className="delta muted">رنگ و سایز بدون موجودی</span></div>
        <div className="kpi"><small>رو به اتمام</small><b className="num">{fa(lowCombos)}</b><span className="delta muted">{fa(LOW)} عدد یا کمتر</span></div>
      </div>

      <div className="suggestions bleed filter-row" style={{ marginBlockStart: 'var(--s4)' }}>
        {FILTERS.map(([k, label]) => (
          <button key={k} className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</button>
        ))}
        <span className="stock-sep" aria-hidden="true" />
        <button className="chip" aria-pressed={cat === ''} onClick={() => setCat('')}>همهٔ دسته‌ها</button>
        {categories.map((c) => (
          <button key={c.slug} className="chip" aria-pressed={cat === c.slug} onClick={() => setCat(c.slug)}>{c.name}</button>
        ))}
      </div>

      <input
        className="field"
        type="search"
        aria-label="جست‌وجوی محصول"
        placeholder="جست‌وجوی محصول"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginBlock: 'var(--s3)' }}
      />

      {rows.length === 0 ? (
        <div className="panel"><p className="panel-empty">محصولی با این فیلترها نیست.</p></div>
      ) : (
        rows.map((p) => (
          <div className="panel stock-card" key={p.id}>
            <div className="stock-head">
              <span>
                <b><Link to={`/p/${p.slug}`}>{p.name}</Link></b>
                <small>{categories.find((c) => c.slug === p.category)?.name} · {p.fit}</small>
              </span>
              <span className="num stock-total">
                {fa(
                  p.colors.reduce(
                    (sum, c) => sum + p.sizes.reduce((n, s) => n + (Number(normalize(String(valueOf(p, c, s)))) || 0), 0),
                    0
                  )
                )} عدد
              </span>
            </div>

            <div className="table-scroll">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>رنگ</th>
                    {p.sizes.map((s) => <th key={s}>{p.sizeLabels?.[s] ?? s}</th>)}
                    <th>جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {p.colors.map((c) => {
                    const rowTotal = p.sizes.reduce((n, s) => n + (Number(normalize(String(valueOf(p, c, s)))) || 0), 0);
                    return (
                      <tr key={c.name}>
                        <td>
                          <span className="stock-colour">
                            <i style={{ background: c.hex }} />
                            {c.name}
                            <button
                              type="button"
                              className="btn-quiet stock-fill"
                              onClick={() => fillRow(p, c)}
                              title="همهٔ سایزهای این رنگ"
                            >
                              همه
                            </button>
                          </span>
                        </td>
                        {p.sizes.map((s) => {
                          const shown = valueOf(p, c, s);
                          const n = Number(normalize(String(shown))) || 0;
                          const edited = draft[p.id]?.[c.name]?.[s] !== undefined;
                          return (
                            <td key={s}>
                              <span className="stock-stack">
                                <input
                                  className={`stock-cell ${n === 0 ? 'out' : n <= LOW ? 'low' : ''} ${edited ? 'edited' : ''}`}
                                  type="text"
                                  inputMode="numeric"
                                  value={String(shown)}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => setCell(p, c, s, e.target.value)}
                                  aria-label={`${p.name} — ${c.name}، اندازهٔ ${p.sizeLabels?.[s] ?? s}`}
                                />
                                <span className="stock-steps">
                                  <button
                                    type="button"
                                    onClick={() => bump(p, c, s, 1)}
                                    aria-label={`یکی اضافه به ${c.name} ${p.sizeLabels?.[s] ?? s}`}
                                  >
                                    <Icon d={art.plus} size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => bump(p, c, s, -1)}
                                    disabled={n === 0}
                                    aria-label={`یکی کم از ${c.name} ${p.sizeLabels?.[s] ?? s}`}
                                  >
                                    <Icon d={art.minus} size={11} />
                                  </button>
                                </span>
                              </span>
                            </td>
                          );
                        })}
                        <td className="num stock-rowtotal">{fa(rowTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {dirtyCells > 0 && (
        <div className="stock-bar" role="status">
          <span>
            <Icon d={art.warn} size={16} />
            {fa(dirtyCells)} عدد در {fa(dirtyIds.length)} محصول عوض شده و ذخیره نشده.
          </span>
          <span className="row" style={{ gap: 'var(--s2)' }}>
            <button className="btn btn-ghost" onClick={() => setDraft({})}>
              <Icon d={art.undo} size={15} /> برگرداندن
            </button>
            <button className="btn btn-primary" onClick={save}>
              <Icon d={art.save} size={15} /> ذخیرهٔ همه
            </button>
          </span>
        </div>
      )}
    </>
  );
}
