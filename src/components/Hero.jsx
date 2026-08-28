import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../data/products';
import { armMorph } from '../lib/morph';
import { toman, fa } from '../lib/format';

const ROTATE_MS = 5000;

/** New arrivals lead; bestsellers fill the rest so the banner is never thin. */
function pickSlides(limit = 5) {
  const fresh = products.filter((p) => p.new);
  const strong = [...products].sort((a, b) => b.sales - a.sales);
  const out = [];
  for (const p of [...fresh, ...strong]) {
    if (out.length >= limit) break;
    if (!out.some((x) => x.id === p.id)) out.push(p);
  }
  return out;
}

const Arrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 5 7 12l7 7" />
  </svg>
);

export default function Hero() {
  const slides = useRef(pickSlides()).current;
  const [i, setI] = useState(0);
  // Once someone picks a shot themselves, the banner stops deciding for them.
  const [taken, setTaken] = useState(false);
  const artRef = useRef(null);
  const rootRef = useRef(null);

  /* Auto-advance, but only while it is worth spending: never for someone who
     asked for less motion, never on a hidden tab, and never while the banner
     is scrolled off screen. */
  useEffect(() => {
    if (taken || slides.length < 2) return undefined;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (still.matches) return undefined;

    let onScreen = true;
    const tick = () => {
      if (document.visibilityState === 'visible' && onScreen) {
        setI((n) => (n + 1) % slides.length);
      }
    };
    const timer = setInterval(tick, ROTATE_MS);

    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }, { threshold: 0.25 });
    if (rootRef.current) io.observe(rootRef.current);

    return () => { clearInterval(timer); io.disconnect(); };
  }, [taken, slides.length]);

  const active = slides[i];
  const shot = (p) => p.colors[0].photos[0];

  return (
    <section className="hero" ref={rootRef}>
      <div className="wrap hero-grid">
        <Link
          to={`/p/${active.slug}`}
          className="hero-art"
          data-morph
          ref={artRef}
          viewTransition
          onClick={() => armMorph(artRef.current)}
          aria-label={active.name}
        >
          {/* Every shot is mounted and crossfaded by opacity — swapping one
              src would blank the frame for the length of the decode, which is
              exactly what the banner is on screen to avoid. */}
          {slides.map((p, n) => (
            <img
              key={p.id}
              className={`hero-shot ${n === i ? 'on' : ''}`}
              src={shot(p)}
              alt={n === i ? p.name : ''}
              aria-hidden={n === i ? undefined : 'true'}
              loading={n === 0 ? 'eager' : 'lazy'}
              fetchPriority={n === 0 ? 'high' : 'low'}
              decoding="async"
              draggable="false"
            />
          ))}
          <span className="hero-scrim" aria-hidden="true" />
        </Link>

        <div className="hero-lede">
          <p className="eyebrow">دوخت تهران · نخ پنبهٔ ایرانی</p>
          <h1>
            رنگ را
            <br />
            <em>خودت</em> انتخاب کن.
          </h1>

          {/* Names the shot on screen. It shows a price and an arrow, so it has
              to actually go somewhere — same destination as the photo. */}
          <Link
            className="hero-now"
            key={active.id}
            to={`/p/${active.slug}`}
            viewTransition
            onClick={() => armMorph(artRef.current)}
          >
            <span className="hero-now-name">{active.name}</span>
            <span className="hero-now-price num">{toman(active.price)}</span>
            <Arrow />
          </Link>

          {slides.length > 1 && (
            <div className="hero-dots">
              {slides.map((p, n) => (
                <button
                  key={p.id}
                  aria-label={`نمایش ${p.name}`}
                  aria-current={n === i}
                  className={n === i ? 'on' : ''}
                  onClick={() => { setI(n); setTaken(true); }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="hero-foot">
          <p className="hero-blurb">
            هر رنگ عکس خودش را دارد، نه فیلتر رنگی روی یک عکس. آنچه می‌بینی همان است که به دستت
            می‌رسد.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary">دیدن همهٔ تیشرت‌ها</Link>
            <Link to="/ask" className="btn btn-ghost">نمی‌دانم کدام را بخرم</Link>
          </div>
          <div className="hero-stats">
            <span><b className="num">{fa(products.length)}</b> مدل</span>
            <span>
              <b className="num">{fa(new Set(products.flatMap((p) => p.colors.map((c) => c.name))).size)}</b> رنگ
            </span>
            <span><b>۷ روز</b> تعویض سایز رایگان</span>
          </div>
        </div>
      </div>
    </section>
  );
}
