import { NavLink, Outlet, Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';
import { ADMIN_PATH } from '../lib/routes';

const links = [
  { to: `/${ADMIN_PATH}`, label: 'خلاصهٔ فروش', end: true },
  { to: `/${ADMIN_PATH}/catalog`, label: 'محصولات' },
  { to: `/${ADMIN_PATH}/orders`, label: 'سفارش‌ها' },
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
