import { useState } from 'react';
import { Link } from 'react-router-dom';
import { reviewsFor } from '../data/reviews';
import { useAccount } from '../lib/account';
import { useShop } from '../lib/store';
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

/** Sample entries plus whatever this browser has written, newest first, and
 *  summarised together — a review you just left must move the average you are
 *  looking at, or the page looks like it ignored you. */
export function useProductReviews(productId) {
  const { myReviews } = useAccount();
  const mine = myReviews.filter((r) => r.product === productId);
  const list = [...mine, ...reviewsFor(productId)];
  if (!list.length) return { list, summary: null, mine: null };
  const total = list.reduce((s, r) => s + r.rating, 0);
  const stars = [5, 4, 3, 2, 1].map((n) => ({ n, count: list.filter((r) => r.rating === n).length }));
  return { list, summary: { count: list.length, average: total / list.length, stars }, mine: mine[0] ?? null };
}

export default function Reviews({ product }) {
  const [all, setAll] = useState(false);
  const { list, summary, mine } = useProductReviews(product.id);

  if (!summary) {
    return (
      <section className="section reviews" id="reviews">
        <div className="section-head"><h2>نظر خریداران</h2></div>
        <p className="muted">هنوز نظری برای این مدل ثبت نشده است.</p>
        <ReviewForm product={product} mine={null} />
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
                <span className="review-avatar" aria-hidden="true">{(r.name ?? 'من').trim()[0]}</span>
                <b>{r.name ?? 'شما'}</b>
                {r.mine && <span className="badge">نظر شما</span>}
              </span>
              <Stars value={r.rating} label={`${r.rating} از ۵`} />
            </div>
            <p className="review-body">{r.body}</p>
            <p className="review-meta">
              {r.date}
              {r.size && <> · اندازهٔ {product.sizeLabels?.[r.size] ?? r.size}</>}
              {r.note && <> · {r.note}</>}
              {typeof r.helpful === 'number' && (
                <> · <span className="num">{fa(r.helpful)}</span> نفر مفید دانستند</>
              )}
            </p>
          </li>
        ))}
      </ul>

      {list.length > SHOW && (
        <button className="btn btn-ghost btn-block" onClick={() => setAll((v) => !v)}>
          {all ? 'بستن' : `دیدن هر ${fa(list.length)} نظر`}
        </button>
      )}

      <ReviewForm product={product} mine={mine} />

      <p className="review-note">
        نظرهای بالا نمونه‌اند و برای نمایش قالب نوشته شده‌اند، نه نظر خریدار واقعی. نظر خودت فقط
        در همین مرورگر ذخیره می‌شود.
      </p>
    </section>
  );
}

/** Writing a review. Signed-in only, one per product, editable and removable
 *  — it is the writer's own text and it lives in their own browser. */
function ReviewForm({ product, mine }) {
  const { signedIn, addReview, removeReview } = useAccount();
  const { toast } = useShop();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(mine?.rating ?? 5);
  const [body, setBody] = useState(mine?.body ?? '');
  const [error, setError] = useState('');

  if (!signedIn) {
    return (
      <div className="review-cta">
        <p>این تیشرت را خریده‌ای؟ نظرت به بقیه کمک می‌کند.</p>
        <Link to="/enter" className="btn btn-ghost">برای ثبت نظر وارد شو</Link>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="review-cta">
        <p>{mine ? 'نظرت ثبت شده است.' : 'نظرت را دربارهٔ این تیشرت بنویس.'}</p>
        <div className="row" style={{ gap: 'var(--s3)', flexWrap: 'wrap' }}>
          <button
            className="btn btn-ghost"
            onClick={() => { setRating(mine?.rating ?? 5); setBody(mine?.body ?? ''); setOpen(true); }}
          >
            {mine ? 'ویرایش نظر' : 'ثبت نظر'}
          </button>
          {mine && (
            <button className="btn-quiet" onClick={() => { removeReview(product.id); toast('نظرت حذف شد', 'warn'); }}>
              حذف نظر
            </button>
          )}
        </div>
      </div>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    if (body.trim().length < 10) return setError('کمی بیشتر بنویس — دست‌کم ده حرف.');
    addReview({ product: product.id, rating, body });
    toast('نظرت ثبت شد');
    setOpen(false);
    setError('');
  };

  return (
    <form className="review-form" onSubmit={submit} noValidate>
      <p className="label">امتیازت</p>
      <div className="rate-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={n <= rating ? 'on' : ''}
            aria-label={`${fa(n)} ستاره`}
            aria-pressed={n === rating}
            onClick={() => setRating(n)}
          >
            <Star on={n <= rating} />
          </button>
        ))}
      </div>

      <label>
        <span className="label">نظرت</span>
        <textarea
          className="field"
          rows="4"
          value={body}
          onChange={(e) => { setBody(e.target.value); setError(''); }}
          placeholder="تن‌خورش چطور بود؟ اندازه‌اش با جدول خواند؟ بعد از شست‌وشو چه شد؟"
        />
      </label>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="row" style={{ gap: 'var(--s3)' }}>
        <button className="btn btn-primary grow" type="submit">ثبت</button>
        <button className="btn btn-ghost" type="button" onClick={() => { setOpen(false); setError(''); }}>انصراف</button>
      </div>
    </form>
  );
}
