import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Photo, preload } from './States';
import { useShop } from '../lib/store';
import { toman, off, fa } from '../lib/format';

const Heart = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
    <path d="M12 20s-7-4.6-7-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.6C19 15.4 12 20 12 20Z" />
  </svg>
);

export default function ProductCard({ product: p, eager, onQuickView }) {
  const [ci, setCi] = useState(0);
  const { wish, toggleWish } = useShop();
  const color = p.colors[ci];
  const discount = off(p.price, p.oldPrice);
  const liked = wish.includes(p.id);
  const soldOut = p.stock === 0;

  return (
    <article className="card">
      <div className="card-media">
        <Link to={`/p/${p.slug}`} aria-label={p.name}>
          <Photo src={color.photos[0]} alt={`${p.name} — رنگ ${color.name}`} eager={eager} tone={color.hex} />
        </Link>
        <div className="card-tags">
          {soldOut && <span className="badge badge-out">سفارشی</span>}
          {p.new && !soldOut && <span className="badge badge-new">جدید</span>}
          {discount > 0 && <span className="badge badge-sale">{fa(discount)}٪</span>}
        </div>
        <button
          className="wish"
          aria-pressed={liked}
          aria-label={liked ? `حذف ${p.name} از علاقه‌مندی‌ها` : `افزودن ${p.name} به علاقه‌مندی‌ها`}
          onClick={() => toggleWish(p.id)}
        >
          <Heart />
        </button>
        {onQuickView && (
          <button className="card-quick" onClick={() => onQuickView(p, ci)}>
            نگاه سریع
          </button>
        )}
      </div>

      <div className="card-body">
        <Link to={`/p/${p.slug}`}>
          <h3 className="card-title">{p.name}</h3>
        </Link>
        <span className="card-meta">{p.fit} · {fa(p.gsm)} گرم</span>

        {p.colors.length > 1 && (
          <div className="card-swatches">
            {p.colors.map((c, i) => (
              <button
                key={c.name}
                className="sw"
                style={{ background: c.hex }}
                aria-pressed={i === ci}
                aria-label={`رنگ ${c.name}`}
                onMouseEnter={() => preload(c.photos[0])}
                onClick={() => setCi(i)}
              />
            ))}
            <span className="muted" style={{ fontSize: 'var(--t-xs)', marginInlineStart: 2 }}>{color.name}</span>
          </div>
        )}

        <div className="card-price num">
          {toman(p.price)}
          {p.oldPrice && <s>{toman(p.oldPrice, { unit: false })}</s>}
        </div>
      </div>
    </article>
  );
}
