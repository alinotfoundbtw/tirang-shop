import { NavLink, Outlet, Link } from 'react-router-dom';
import { useSeo } from '../lib/seo';

const links = [
  { to: '/admin', label: 'خلاصهٔ فروش', end: true },
  { to: '/admin/catalog', label: 'محصولات' },
  { to: '/admin/orders', label: 'سفارش‌ها' },
  { to: '/admin/brand', label: 'ظاهر فروشگاه' },
];

export default function Admin() {
  useSeo({ title: 'پنل فروشنده', noindex: true, path: '/admin' });

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
