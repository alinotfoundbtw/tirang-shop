import { useEffect, useRef, useState } from 'react';
import { short, toman, fa, percent } from '../lib/format';

/**
 * Weekly revenue.
 *
 * Measured, not scaled. The previous version set a 320×150 viewBox to
 * `width:100%; height:auto`, so on a 900px panel the browser scaled the whole
 * drawing to 900×422 — a chart taller than the phone it was designed for, with
 * 7px labels blown up to 20. Here the container's width is measured and the
 * geometry is drawn at that size, so one unit is one pixel at every width and
 * the height stays put.
 *
 * Bars rather than an area: seven discrete weeks are compared to each other,
 * not read as a continuous line, and a bar makes "which week was bigger" a
 * glance instead of a squint.
 */

const H = 132;
const PAD = { top: 10, right: 4, bottom: 20, left: 40 };

export default function RevenueChart({ series }) {
  const box = useRef(null);
  const [w, setW] = useState(0);
  const [active, setActive] = useState(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!series?.length) return null;

  const shown = active ?? series.length - 1;
  const d = series[shown];
  const prev = series[shown - 1];
  const delta = prev ? ((d.revenue - prev.revenue) / prev.revenue) * 100 : null;

  const plotW = Math.max(0, w - PAD.left - PAD.right);
  const plotH = H - PAD.top - PAD.bottom;
  const max = Math.max(...series.map((s) => s.revenue)) * 1.1;

  // Newest on the left: the axis runs the same direction as the language.
  const step = plotW / series.length;
  const barW = Math.min(34, Math.max(10, step * 0.52));
  const x = (i) => PAD.left + plotW - step * (i + 0.5);
  const y = (v) => PAD.top + plotH - (v / max) * plotH;

  return (
    <div className="chart" ref={box}>
      <div className="chart-read">
        <b className="num">{toman(d.revenue)}</b>
        <small>
          {d.day} · <span className="num">{fa(d.orders)}</span> سفارش
          {delta !== null && (
            <span className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
              {' '}{delta >= 0 ? '▲' : '▼'} {percent(delta)}
            </span>
          )}
        </small>
      </div>

      {w > 0 && (
        <svg
          width={w}
          height={H}
          viewBox={`0 0 ${w} ${H}`}
          role="img"
          aria-label={`فروش هفتگی، از ${series[0].day} تا ${series.at(-1).day}`}
          onMouseLeave={() => setActive(null)}
        >
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={w - PAD.right} y1={y(max * t)} y2={y(max * t)} className="chart-grid" />
              <text x={PAD.left - 7} y={y(max * t) + 3.5} className="chart-tick" textAnchor="end">
                {t ? short(max * t) : '۰'}
              </text>
            </g>
          ))}

          {series.map((pt, i) => {
            const on = i === shown;
            const top = y(pt.revenue);
            return (
              <g
                key={pt.day}
                className={`chart-bar ${on ? 'on' : ''}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                tabIndex={0}
                role="button"
                aria-label={`${pt.day}: ${toman(pt.revenue)}`}
              >
                {/* Full-height target, so a fingertip does not have to find a
                    12px-wide bar. */}
                <rect x={x(i) - step / 2} y={PAD.top} width={step} height={plotH} fill="transparent" />
                <rect
                  x={x(i) - barW / 2}
                  y={top}
                  width={barW}
                  height={Math.max(2, PAD.top + plotH - top)}
                  rx={Math.min(5, barW / 2)}
                />
                <text x={x(i)} y={H - 6} className="chart-tick" textAnchor="middle">
                  {pt.day.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
