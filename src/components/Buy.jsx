import { useMemo, useState } from 'react';
import { preload } from './States';
import { suggestSize } from '../lib/store';
import { fa } from '../lib/format';

/** One source of truth for colour + size selection, shared by the product page
 *  and the quick-view sheet so the two can never drift apart. */
export function useVariant(product) {
  const [ci, setCi] = useState(0);
  const color = product.colors[ci];
  const firstAvailable = product.sizes.find((s) => color.stock[s] > 0) ?? product.sizes[0];
  const [size, setSize] = useState(firstAvailable);

  const pickColor = (i) => {
    setCi(i);
    const next = product.colors[i];
    // Keep the chosen size if the new colour has it; otherwise move to one it has.
    if (!(next.stock[size] > 0)) setSize(product.sizes.find((s) => next.stock[s] > 0) ?? size);
  };

  const left = color.stock[size] ?? 0;
  return { ci, color, size, setSize, pickColor, left, inStock: left > 0 };
}

export function ColorPicker({ product, ci, onPick, big = true }) {
  const color = product.colors[ci];
  return (
    <div>
      <span className="label">
        رنگ — <b style={{ color: 'var(--ink)' }}>{color.name}</b>
      </span>
      <div className="row colorpick-row" style={{ flexWrap: 'wrap' }}>
        {product.colors.map((c, i) => {
          const none = Object.values(c.stock).every((n) => n === 0);
          return (
            <button
              key={c.name}
              className={`sw ${big ? 'sw-lg' : ''} ${none ? 'sw-out' : ''}`}
              style={{ background: c.hex }}
              aria-pressed={i === ci}
              aria-label={`رنگ ${c.name}${none ? '، ناموجود' : ''}`}
              onMouseEnter={() => preload(c.photos[0])}
              onTouchStart={() => preload(c.photos[0])}
              onClick={() => onPick(i)}
            />
          );
        })}
      </div>
    </div>
  );
}

export function SizePicker({ product, color, size, onPick }) {
  const labels = product.sizeLabels;
  const left = color.stock[size] ?? 0;
  return (
    <div>
      <div className="row between">
        <span className="label">اندازه</span>
        <a
          href="#size-table"
          className="link-more"
          style={{ fontSize: 'var(--t-xs)' }}
          onClick={() => {
            // Jumping to a collapsed <details> lands the reader on a closed row.
            const el = document.getElementById('size-table');
            if (el) el.open = true;
          }}
        >
          جدول اندازه
        </a>
      </div>
      <div className="size-grid">
        {product.sizes.map((s) => {
          const n = color.stock[s] ?? 0;
          return (
            <button
              key={s}
              className="size-btn"
              aria-pressed={s === size}
              disabled={n === 0}
              onClick={() => onPick(s)}
              title={n === 0 ? 'این سایز در این رنگ تمام شده' : `${n} عدد موجود`}
            >
              {labels?.[s] ?? s}
            </button>
          );
        })}
      </div>
      {left > 0 && left <= 3 && (
        <p className="stock-note" style={{ marginBlockStart: 'var(--s2)' }}>
          فقط {fa(left)} عدد از این سایز و رنگ مانده
        </p>
      )}
      {left === 0 && (
        <p className="muted" style={{ fontSize: 'var(--t-xs)', marginBlockStart: 'var(--s2)' }}>
          این ترکیب تمام شده — رنگ یا اندازهٔ دیگری را انتخاب کنید.
        </p>
      )}
    </div>
  );
}

/** Advisory, not automatic: it names a size, says why, and lets the shopper
 *  overrule it. Guessing silently is how returns happen. */
export function SizeFinder({ product, onApply }) {
  const [h, setH] = useState('');
  const [w, setW] = useState('');
  const result = useMemo(
    () => suggestSize({ height: Number(h), weight: Number(w), fit: product.fit }),
    [h, w, product.fit]
  );

  return (
    <div className="finder">
      <b style={{ fontFamily: 'var(--font-display)' }}>سایزم را پیدا کن</b>
      <p className="muted" style={{ fontSize: 'var(--t-xs)', marginBlockEnd: 'var(--s3)' }}>
        قد و وزن را بنویسید تا سایزی که هم‌شکل‌های شما نگه داشته‌اند را بگوییم.
      </p>
      <div className="finder-row">
        <div>
          <label className="label" htmlFor="fh">قد (سانت)</label>
          <input id="fh" className="field" inputMode="numeric" value={h} onChange={(e) => setH(e.target.value)} placeholder="۱۷۸" />
        </div>
        <div>
          <label className="label" htmlFor="fw">وزن (کیلو)</label>
          <input id="fw" className="field" inputMode="numeric" value={w} onChange={(e) => setW(e.target.value)} placeholder="۷۴" />
        </div>
      </div>
      {result && (
        <div className="finder-out">
          پیشنهاد ما سایز <b>{result.size}</b> است. {result.note}{' '}
          <button className="btn-quiet" style={{ fontSize: 'var(--t-sm)' }} onClick={() => onApply(result.size)}>
            انتخابش کن
          </button>
        </div>
      )}
    </div>
  );
}
