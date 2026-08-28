import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useShop } from '../lib/store';
import { useAccount } from '../lib/account';
import Footer from './Footer';
import QuickSearch from './QuickSearch';
import { fa } from '../lib/format';

const Icon = ({ d, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const icons = {
  home: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.6" /></>,
  spark: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></>,
  bag: <><path d="M6 8h12l1 12H5z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  heart: <path d="M12 20s-7-4.6-7-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.6C19 15.4 12 20 12 20Z" />,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></>,
  moon: <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.5 8.5 0 1 0 10.2 10.2Z" />,
  user: <><circle cx="12" cy="8.5" r="3.4" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5" /><circle cx="12" cy="16.3" r="0.8" fill="currentColor" stroke="none" /></>,
};

const notes = [
  'ارسال رایگان بالای ۱٫۵ میلیون تومان',
  'تعویض سایز رایگان تا ۷ روز',
  'نخ پنبهٔ ایرانی، دوخت تهران',
  'چاپ سفارشی از ۱۰ عدد',
];

const tabs = [
  { to: '/', label: 'خانه', icon: icons.home, end: true },
  { to: '/products', label: 'محصولات', icon: icons.grid },
  { to: '/ask', label: 'مشاور', icon: icons.spark },
  { to: '/cart', label: 'سبد', icon: icons.bag },
];

export default function Layout() {
  const { count, toasts, wish, isDark, toggleTheme } = useShop();
  const { signedIn } = useAccount();
  const { pathname } = useLocation();

  /* Layout effect, so the reset lands inside the same synchronous flush as the
     route swap. As a passive effect it ran after the view transition had
     already snapshotted the incoming page, and the morph finished into place
     only for the page to jump to the top a frame later. */
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  // The badge is small and far from the thumb that just tapped "add" — a beat
  // of movement is what confirms the tap landed.
  /* The header only needs a shadow once it is actually floating over content.
     A sentinel above the fold costs nothing; a scroll listener would run on
     every frame of every scroll to answer one boolean. */
  const [floating, setFloating] = useState(false);
  const sentinel = useRef(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => setFloating(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [pop, setPop] = useState(false);
  useEffect(() => {
    if (!count) return undefined;
    setPop(true);
    const t = setTimeout(() => setPop(false), 420);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <>
      <a className="skip" href="#main">رفتن به محتوا</a>

      <span ref={sentinel} className="scroll-sentinel" aria-hidden="true" />

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[...notes, ...notes].map((n, i) => (
            <span key={i}>{n}</span>
          ))}
        </div>
      </div>

      <header className={`header ${floating ? 'floating' : ''}`}>
        <div className="wrap row between" style={{ width: '100%' }}>
          <Link to="/" className="logo">
            تیرنگ <small>TIRANG</small>
          </Link>

          {/* Four destinations, not a category list. NavLink matches on path and
              ignores the query, so three links to /products all lit up at once
              — every one of them "active" on any products page. Categories
              belong in the filter row on that page, where they already are. */}
          <nav className="nav-desktop" aria-label="اصلی">
            <NavLink to="/" end>خانه</NavLink>
            <NavLink to="/products">تیشرت‌ها</NavLink>
            <NavLink to="/ask">مشاور خرید</NavLink>
            <NavLink to="/faq">راهنما</NavLink>
          </nav>

          <div className="header-actions">
            <QuickSearch />
            <button
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={isDark ? 'روشن کردن ظاهر' : 'تاریک کردن ظاهر'}
              aria-pressed={isDark}
            >
              <Icon d={isDark ? icons.sun : icons.moon} size={20} />
            </button>
            <Link to="/wishlist" className="icon-btn" aria-label={`علاقه‌مندی‌ها، ${wish.length} کالا`}>
              <Icon d={icons.heart} />
              {wish.length > 0 && <span className="cart-count num">{fa(wish.length)}</span>}
            </Link>
            <Link
              to={signedIn ? '/profile' : '/enter'}
              className="icon-btn"
              aria-label={signedIn ? 'پروفایل من' : 'ورود یا ثبت‌نام'}
            >
              <Icon d={icons.user} size={20} />
            </Link>
            <Link to="/cart" className="icon-btn" aria-label={`سبد خرید، ${count} کالا`}>
              <Icon d={icons.bag} />
              {count > 0 && <span className={`cart-count num ${pop ? 'pop' : ''}`}>{fa(count)}</span>}
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>

      <Footer />

      <nav className="tabbar" aria-label="پیمایش موبایل">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end}>
            <Icon d={t.icon} size={21} />
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div className={`toast toast-${t.kind || 'ok'}`} key={t.id}>
            <Icon d={t.kind === 'warn' ? icons.alert : icons.check} size={16} />
            {t.text}
          </div>
        ))}
      </div>
    </>
  );
}
