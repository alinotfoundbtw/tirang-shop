import { useState } from 'react';
import { reviewsFor, reviewSummary } from '../data/reviews';
import { fa } from '../lib/format';

/**
 * Reviews for one product.
 *
 * The content is placeholder — see data/reviews.js — and the section says so
 * rather than passing sample text off as customers. Everything numeric here is
 * computed from the entries, so the average, the bars and the count can never
 * disagree with the reviews printed underneath them.
 */

const Star = ({ on }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className={on ? 'star on' : 'star'}>
    <path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85z" />
  </svg>
);

const Stars = ({ value, label }) => (
  <span className="stars" role="img" aria-label={label ?? `${value} از ۵`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} on={n <= Math.round(value)} />
    ))}
  </span>
);

const SHOW = 3;

export default function Reviews({ product }) {
  const [all, setAll] = useState(false);
  const list = reviewsFor(product.id);
  const summary = reviewSummary(product.id);

  if (!summary) {
    return (
      <section className="section reviews" id="reviews">
        <div className="section-head"><h2>نظر خریداران</h2></div>
        <p className="muted">هنوز نظری برای این مدل ثبت نشده است.</p>
      </section>
    );
  }

  const shown = all ? list : list.slice(0, SHOW);
  const avg = summary.average.toFixed(1).replace('.', '٫');

  return (
    <section className="section reviews" id="reviews">
      <div className="section-head">
        <h2>نظر خریداران</h2>
        <span className="muted" style={{ fontSize: 'var(--t-xs)' }}>نمونه</span>
      </div>

      <div className="review-summary">
        <div className="review-score">
          <b className="num">{fa(avg)}</b>
          <Stars value={summary.average} label={`میانگین ${avg} از ۵`} />
          <small>از {fa(summary.count)} نظر</small>
        </div>
        <ul className="review-bars">
          {summary.stars.map(({ n, count }) => (
            <li key={n}>
              <span className="num">{fa(n)}</span>
              <span className="review-track">
                <i style={{ width: `${(count / summary.count) * 100}%` }} />
              </span>
              <span className="num review-n">{fa(count)}</span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="review-list">
        {shown.map((r) => (
          <li key={r.id}>
            <div className="review-head">
              <span className="review-who">
                <span className="review-avatar" aria-hidden="true">{r.name.trim()[0]}</span>
                <b>{r.name}</b>
              </span>
              <Stars value={r.rating} label={`${r.rating} از ۵`} />
            </div>
            <p className="review-body">{r.body}</p>
            <p className="review-meta">
              {r.date}
              {r.size && <> · اندازهٔ {product.sizeLabels?.[r.size] ?? r.size}</>}
              {r.note && <> · {r.note}</>}
              {' · '}
              <span className="num">{fa(r.helpful)}</span> نفر مفید دانستند
            </p>
          </li>
        ))}
      </ul>

      {list.length > SHOW && (
        <button className="btn btn-ghost btn-block" onClick={() => setAll((v) => !v)}>
          {all ? 'بستن' : `دیدن هر ${fa(list.length)} نظر`}
        </button>
      )}

      <p className="review-note">
        این نظرها نمونه‌اند و برای نمایش قالب نوشته شده‌اند، نه نظر خریدار واقعی.
      </p>
    </section>
  );
}
