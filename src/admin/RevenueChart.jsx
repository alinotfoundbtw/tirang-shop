import { useId, useState } from 'react';
import { short, toman, fa } from '../lib/format';

/**
 * Weekly revenue, drawn by hand.
 *
 * This replaced Recharts, which was 383 KB (105 KB gzipped) — by a wide margin
 * the largest asset in the build — to plot seven points on one panel. The shop
 * owner opening this on Iranian mobile data was paying for a charting engine to
 * draw a single polygon.
 *
 * Reads right to left, like the rest of the panel: oldest week on the right,
 * this week on the left.
 */

const W = 320; // viewBox units; the SVG scales to its container
const H = 150;
const PAD = { top: 12, right: 8, bottom: 22, left: 38 };

export default function RevenueChart({ series }) {
  const gradient = useId();
  const [active, setActive] = useState(null);

  if (!series?.length) return null;

  const max = Math.max(...series.map((d) => d.revenue));
  const top = max * 1.12;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Newest on the left: the axis runs the same direction as the language.
  const x = (i) => PAD.left + plotW - (i / (series.length - 1)) * plotW;
  const y = (v) => PAD.top + plotH - (v / top) * plotH;

  const line = series.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(d.revenue).toFixed(1)}`).join(' ');
  const area = `${line} L${x(0).toFixed(1)} ${PAD.top + plotH} L${x(series.length - 1).toFixed(1)} ${PAD.top + plotH} Z`;
  const ticks = [0, top / 2, top];

  const shown = active ?? series.length - 1;
  const d = series[shown];

  return (
    <div className="chart">
      <div className="chart-read">
        <b className="num">{toman(d.revenue)}</b>
        <small>
          {d.day} · <span className="num">{fa(d.orders)}</span> سفارش
        </small>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`فروش هفتگی، از ${series[0].day} تا ${series.at(-1).day}`}
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--wine)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="var(--wine)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={PAD.left - 6} y={y(t) + 3.5} className="chart-tick" textAnchor="end">
              {t ? short(t) : '۰'}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradient})`} />
        <path d={line} className="chart-line" />

        {series.map((pt, i) => (
          <g key={pt.day}>
            <circle cx={x(i)} cy={y(pt.revenue)} r={i === shown ? 4 : 2.5} className="chart-dot" />
            <text x={x(i)} y={H - 6} className="chart-tick" textAnchor="middle">
              {pt.day.split(' ')[0]}
            </text>
            {/* A full-height band per point, so a fingertip does not have to
                land on a 4px dot to read that week. */}
            <rect
              x={x(i) - plotW / (series.length - 1) / 2}
              y={PAD.top}
              width={plotW / (series.length - 1)}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              tabIndex={0}
              role="button"
              aria-label={`${pt.day}: ${toman(pt.revenue)}`}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
