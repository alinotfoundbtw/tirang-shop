import { Link } from 'react-router-dom';

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);

const art = {
  truck: <><path d="M2.5 7.5h11v9h-11z" /><path d="M13.5 11h4l3 3v2.5h-7z" /><circle cx="6.5" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  swap: <><path d="M3.5 8.5h13l-3-3M20.5 15.5h-13l3 3" /></>,
  scissors: <><circle cx="6" cy="6.5" r="2.5" /><circle cx="6" cy="17.5" r="2.5" /><path d="M8.2 8 20 17M8.2 16 20 7" /></>,
  instagram: <><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none" /></>,
  phone: <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />,
  up: <path d="m6 14 6-6 6 6" />,
};

/* The promises were already scrolling past in the header ticker, where they
   are gone in a second. Repeated here they are the footer's first line, which
   is where someone looks when they are deciding whether to trust the shop. */
const promises = [
  { icon: art.truck, title: 'ارسال رایگان', note: 'سفارش بالای ۱٫۵ میلیون تومان' },
  { icon: art.swap, title: 'تعویض سایز رایگان', note: 'تا ۷ روز، بدون پرسش' },
  { icon: art.scissors, title: 'دوخت تهران', note: 'نخ پنبهٔ ایرانی' },
];

const columns = [
  {
    heading: 'فروشگاه',
    links: [
      { to: '/products', label: 'همهٔ تیشرت‌ها' },
      { to: '/products?cat=pack', label: 'پک اقتصادی' },
      { to: '/products?cat=kids', label: 'بچگانه' },
      { to: '/wishlist', label: 'علاقه‌مندی‌ها' },
    ],
  },
  {
    heading: 'راهنما',
    links: [
      { to: '/faq', label: 'جدول اندازه' },
      { to: '/faq', label: 'تعویض و مرجوعی' },
      { to: '/ask', label: 'مشاور خرید' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <ul className="promises">
          {promises.map((p) => (
            <li key={p.title}>
              <span className="promise-art"><Icon d={p.icon} size={20} /></span>
              <b>{p.title}</b>
              <small>{p.note}</small>
            </li>
          ))}
        </ul>

        <div className="footer-cols">
          <div className="footer-brand">
            <Link to="/" className="logo">تیرنگ <small>TIRANG</small></Link>
            <p>تیشرت پایه و طرح‌دار با نخ پنبهٔ ایرانی. رنگ‌ها همان‌اند که در عکس می‌بینید.</p>
            <div className="footer-social">
              <a href="https://instagram.com" rel="noopener noreferrer nofollow" target="_blank" aria-label="اینستاگرام">
                <Icon d={art.instagram} />
              </a>
              <a href="tel:+982100000000" aria-label="تماس تلفنی">
                <Icon d={art.phone} />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3>{col.heading}</h3>
              <nav aria-label={col.heading}>
                {col.links.map((l) => (
                  <Link key={l.label} to={l.to}>{l.label}</Link>
                ))}
              </nav>
            </div>
          ))}

          <div>
            <h3>ارتباط</h3>
            <nav aria-label="ارتباط">
              <a href="tel:+982100000000" className="num">۰۲۱-۰۰۰۰۰۰۰۰</a>
              <a href="https://instagram.com" rel="noopener noreferrer nofollow" target="_blank">اینستاگرام</a>
            </nav>
            <p className="footer-hours">شنبه تا چهارشنبه، ۱۰ تا ۱۸</p>
          </div>
        </div>

        <div className="footer-base">
          <span>© ۱۴۰۵ تیرنگ — همهٔ حقوق محفوظ است.</span>
          <span>تصاویر نمونه از Pexels</span>
          <button
            className="to-top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Icon d={art.up} size={15} />
            بالا
          </button>
        </div>
      </div>
    </footer>
  );
}
