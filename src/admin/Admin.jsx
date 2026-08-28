import { NavLink, Outlet, Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';
import { ADMIN_PATH } from '../lib/routes';

const Icon = ({ d }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const art = {
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  tag: <><path d="M3.5 11.5V4.5a1 1 0 0 1 1-1h7l9 9-8 8-9-9z" /><circle cx="7.5" cy="7.5" r="1.4" /></>,
  box: <><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></>,
  layers: <><path d="M12 3 3 7.5l9 4.5 9-4.5z" /><path d="M3 12.5 12 17l9-4.5" /><path d="M3 17 12 21.5 21 17" /></>,
};

const links = [
  { to: `/${ADMIN_PATH}`, label: 'خلاصهٔ فروش', icon: art.chart, end: true },
  { to: `/${ADMIN_PATH}/catalog`, label: 'محصولات', icon: art.tag },
  { to: `/${ADMIN_PATH}/stock`, label: 'موجودی', icon: art.layers },
  { to: `/${ADMIN_PATH}/orders`, label: 'سفارش‌ها', icon: art.box },
];

export default function Admin() {
  useSeo({ title: 'پنل فروشنده', noindex: true, path: `/${ADMIN_PATH}` });

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="row between" style={{ marginBlockEnd: 'var(--s4)' }}>
          <Link to="/" className="logo" style={{ fontSize: '1.2rem' }}>تیرنگ</Link>
          <Link to="/" className="muted" style={{ fontSize: 'var(--t-xs)' }}>
            دیدن سایت ↗
          </Link>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end}>
              <Icon d={l.icon} />
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
