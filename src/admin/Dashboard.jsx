import { Link } from 'react-router-dom';
import { products, categories, revenueSeries, orders, botGaps, sizeCurve } from '../data/products';
import RevenueChart from './RevenueChart';
import { toman, short, fa, percent } from '../lib/format';

const last = revenueSeries.at(-1);
const prev = revenueSeries.at(-2) ?? last;
// A single week of history is not a trend; say nothing rather than divide by it.
const growth = prev === last ? null : ((last.revenue - prev.revenue) / prev.revenue) * 100;
const orderGrowth = prev === last ? null : ((last.orders - prev.orders) / prev.orders) * 100;
const weekRevenue = last.revenue;
const weekOrders = last.orders;
const aov = Math.round(weekRevenue / weekOrders);

const Kpi = ({ label, value, delta, note }) => (
  <div className="kpi">
    <small>{label}</small>
    <b>{value}</b>
    {delta !== undefined && delta !== null ? (
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
        <Kpi label="سفارش‌ها" value={fa(weekOrders)} delta={orderGrowth} />
        <Kpi label="میانگین سبد" value={short(aov)} note="تومان به ازای هر سفارش" />
        <Kpi label="نیازمند اقدام" value={fa(low.length + orders.filter((o) => o.status === 'wait').length)} note="کالای رو به اتمام و سفارش معطل" />
      </div>

      <div className="panel">
        <h3>روند فروش هفت هفتهٔ اخیر</h3>
        <RevenueChart series={revenueSeries} />
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
          {low.length === 0 && (
            <p className="panel-empty">هیچ کالایی رو به اتمام نیست. موجودی همهٔ سایزها سالم است.</p>
          )}
          {low.length > 0 && (
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
          )}
        </div>

        <div className="panel">
          <h3>چیزهایی که مشتری خواست و نداشتیم</h3>
          <p className="muted" style={{ fontSize: 'var(--t-xs)', marginBlockEnd: 'var(--s3)' }}>
            از پرسش‌های مشاور خرید درمی‌آید. هر خط یعنی تقاضایی که همین حالا در فروشگاه جوابی ندارد.
          </p>
          {botGaps.length === 0 && <p className="panel-empty">پرسشی بی‌جواب نمانده است.</p>}
          {botGaps.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>پرسش</th><th>دفعات</th><th><span className="sr">اقدام</span></th></tr>
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
          )}
        </div>
      </div>
    </>
  );
}
