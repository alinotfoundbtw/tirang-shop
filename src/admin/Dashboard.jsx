import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { products, categories, revenueSeries, orders, botGaps, sizeCurve } from '../data/products';
import { toman, short, fa, percent } from '../lib/format';

const last = revenueSeries.at(-1);
const prev = revenueSeries.at(-2);
const growth = ((last.revenue - prev.revenue) / prev.revenue) * 100;
const weekRevenue = last.revenue;
const weekOrders = last.orders;
const aov = Math.round(weekRevenue / weekOrders);

const Kpi = ({ label, value, delta, note }) => (
  <div className="kpi">
    <small>{label}</small>
    <b>{value}</b>
    {delta !== undefined ? (
      <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
        {delta >= 0 ? '▲' : '▼'} {percent(delta)} از هفتهٔ قبل
      </span>
    ) : (
      <span className="delta muted">{note}</span>
    )}
  </div>
);

export default function Dashboard() {
  const top = [...products].sort((a, b) => b.sales - a.sales).slice(0, 5);
  const max = top[0].sales;
  const low = products
    .filter((p) => p.stock === 0 || p.sizes.some((s) => p.colors.every((c) => (c.stock[s] ?? 0) === 0)))
    .sort((a, b) => a.stock - b.stock);
  const revenueByCat = products.reduce((acc, p) => {
    const name = categories.find((c) => c.slug === p.category)?.name || p.category;
    acc[name] = (acc[name] || 0) + p.sales * p.price;
    return acc;
  }, {});
  const returnRate = sizeCurve.map((r) => ({ ...r, rate: (r.returned / r.sold) * 100 }));
  const worst = [...returnRate].sort((a, b) => b.rate - a.rate)[0];
  const catTotal = Object.values(revenueByCat).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="row between" style={{ flexWrap: 'wrap', marginBlockEnd: 'var(--s4)' }}>
        <div>
          <p className="eyebrow">هفتهٔ جاری</p>
          <h1 style={{ fontSize: 'var(--t-h1)' }}>خلاصهٔ فروش</h1>
        </div>
        <span className="muted" style={{ fontSize: 'var(--t-sm)' }}>به‌روزرسانی: امروز ۹:۴۰</span>
      </div>

      <div className="kpis">
        <Kpi label="فروش هفته" value={toman(weekRevenue, { unit: false })} delta={growth} />
        <Kpi label="سفارش‌ها" value={fa(weekOrders)} delta={((weekOrders - prev.orders) / prev.orders) * 100} />
        <Kpi label="میانگین سبد" value={short(aov)} note="تومان به ازای هر سفارش" />
        <Kpi label="نیازمند اقدام" value={fa(low.length + orders.filter((o) => o.status === 'wait').length)} note="کالای رو به اتمام و سفارش معطل" />
      </div>

      <div className="panel">
        <h3>روند فروش هفت هفتهٔ اخیر</h3>
        <div style={{ width: '100%', height: 240, direction: 'ltr' }}>
          <ResponsiveContainer>
            <AreaChart data={revenueSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--wine)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--wine)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--ink-45)' }} axisLine={false} tickLine={false} reversed />
              <YAxis
                tickFormatter={(v) => short(v)}
                tick={{ fontSize: 11, fill: 'var(--ink-45)' }}
                axisLine={false}
                tickLine={false}
                orientation="right"
                width={54}
              />
              <Tooltip
                formatter={(v) => [toman(v), 'فروش']}
                labelStyle={{ fontFamily: 'var(--font-body)' }}
                contentStyle={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  direction: 'rtl',
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--wine)" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--s4)', gridTemplateColumns: '1fr' }}>
        <div className="panel">
          <h3>پرفروش‌ترین‌ها</h3>
          {top.map((p) => (
            <div className="bar-row" key={p.id}>
              <div className="row between" style={{ fontSize: 'var(--t-sm)' }}>
                <span>{p.name}</span>
                <span className="muted num">{fa(p.sales)} فروش</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(p.sales / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3>سهم هر دسته از درآمد</h3>
          {Object.entries(revenueByCat)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, sum]) => (
              <div className="bar-row" key={cat}>
                <div className="row between" style={{ fontSize: 'var(--t-sm)' }}>
                  <span>{cat}</span>
                  <span className="muted num">{percent((sum / catTotal) * 100)}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${(sum / catTotal) * 100}%`, background: 'var(--cherry)' }} />
                </div>
              </div>
            ))}
        </div>

        <div className="panel">
          <h3>سایزی که می‌فروشد و سایزی که برمی‌گردد</h3>
          <p className="muted" style={{ fontSize: 'var(--t-xs)', marginBlockEnd: 'var(--s3)' }}>
            نسبت مرجوعی به فروش برای هر سایز. سایز {worst.size} بیشترین برگشت را دارد
            ({percent(worst.rate)}) — یعنی اندازه‌اش با جدول سایت نمی‌خواند و باید بازبینی شود.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>سایز</th><th>فروش</th><th>مرجوعی</th><th>نرخ برگشت</th></tr>
              </thead>
              <tbody>
                {returnRate.map((r) => (
                  <tr key={r.size}>
                    <td><b>{r.size}</b></td>
                    <td className="num">{fa(r.sold)}</td>
                    <td className="num">{fa(r.returned)}</td>
                    <td>
                      <span className={`pill ${r.rate > 8 ? 'wait' : 'paid'}`}>{percent(r.rate)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3>رو به اتمام — قبل از خالی‌شدن سفارش بدهید</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>محصول</th><th>موجودی کل</th><th>سایزهای تمام‌شده</th><th>وضعیت</th></tr>
              </thead>
              <tbody>
                {low.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="num">{fa(p.stock)}</td>
                    <td className="muted">
                      {p.sizes
                        .filter((s) => p.colors.every((c) => (c.stock[s] ?? 0) === 0))
                        .map((s) => p.sizeLabels?.[s] ?? s)
                        .join('، ') || '—'}
                    </td>
                    <td>
                      <span className={`pill ${p.stock === 0 ? 'wait' : 'sent'}`}>
                        {p.stock === 0 ? 'کاملاً تمام' : 'بعضی سایزها تمام'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h3>چیزهایی که مشتری خواست و نداشتیم</h3>
          <p className="muted" style={{ fontSize: 'var(--t-xs)', marginBlockEnd: 'var(--s3)' }}>
            از پرسش‌های مشاور خرید درمی‌آید. هر خط یعنی تقاضایی که همین حالا در فروشگاه جوابی ندارد.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>پرسش</th><th>دفعات</th><th></th></tr>
              </thead>
              <tbody>
                {botGaps.map((g) => (
                  <tr key={g.q}>
                    <td>{g.q}</td>
                    <td className="num">{fa(g.count)}</td>
                    <td><Link className="link-more" to="/admin/catalog">افزودن محصول</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
