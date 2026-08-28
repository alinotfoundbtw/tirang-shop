import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useShop } from '../lib/store';
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
  const { count, toasts, wish } = useShop();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <>
      <a className="skip" href="#main">رفتن به محتوا</a>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[...notes, ...notes].map((n, i) => (
            <span key={i}>{n}</span>
          ))}
        </div>
      </div>

      <header className="header">
        <div className="wrap row between" style={{ width: '100%' }}>
          <Link to="/" className="logo">
            تیرنگ <small>TIRANG</small>
          </Link>

          <nav className="nav-desktop" aria-label="اصلی">
            <NavLink to="/products" end>همهٔ تیشرت‌ها</NavLink>
            <NavLink to="/products?cat=oversize">اورسایز</NavLink>
            <NavLink to="/products?cat=graphic">طرح‌دار</NavLink>
            <NavLink to="/ask">مشاور خرید</NavLink>
            <NavLink to="/admin">پنل فروشنده</NavLink>
          </nav>

          <div className="header-actions">
            <Link to="/products" className="icon-btn" aria-label="جست‌وجو">
              <Icon d={icons.search} />
            </Link>
            <Link to="/wishlist" className="icon-btn" aria-label={`علاقه‌مندی‌ها، ${wish.length} کالا`}>
              <Icon d={icons.heart} />
              {wish.length > 0 && <span className="cart-count num">{fa(wish.length)}</span>}
            </Link>
            <Link to="/cart" className="icon-btn" aria-label={`سبد خرید، ${count} کالا`}>
              <Icon d={icons.bag} />
              {count > 0 && <span className="cart-count num">{fa(count)}</span>}
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        <Outlet />
      </main>

      <footer className="footer has-tabbar">
        <div className="wrap">
          <div className="footer-cols">
            <div>
              <Link to="/" className="logo">تیرنگ</Link>
              <p className="muted" style={{ fontSize: 'var(--t-sm)', maxWidth: '32ch', marginTop: 8 }}>
                تیشرت پایه و طرح‌دار با نخ پنبهٔ ایرانی. رنگ‌ها همان‌اند که در عکس می‌بینید.
              </p>
            </div>
            <div>
              <h3>فروشگاه</h3>
              <nav aria-label="فروشگاه">
                <Link to="/products">همهٔ تیشرت‌ها</Link>
                <Link to="/products?cat=pack">پک اقتصادی</Link>
                <Link to="/products?cat=kids">بچگانه</Link>
                <Link to="/wishlist">علاقه‌مندی‌ها</Link>
              </nav>
            </div>
            <div>
              <h3>راهنما</h3>
              <nav aria-label="راهنما">
                <Link to="/faq">جدول اندازه</Link>
                <Link to="/faq">تعویض و مرجوعی</Link>
                <Link to="/ask">مشاور خرید</Link>
              </nav>
            </div>
            <div>
              <h3>ارتباط</h3>
              <nav aria-label="ارتباط">
                <a href="https://instagram.com" rel="noopener noreferrer nofollow" target="_blank">اینستاگرام</a>
                <a href="tel:+982100000000">۰۲۱-۰۰۰۰۰۰۰۰</a>
              </nav>
            </div>
          </div>
          <div className="footer-base">
            <span>© ۱۴۰۵ تیرنگ — همهٔ حقوق محفوظ است.</span>
            <span>تصاویر نمونه از Pexels</span>
          </div>
        </div>
      </footer>

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
          <div className="toast" key={t.id}>{t.text}</div>
        ))}
      </div>
    </>
  );
}
