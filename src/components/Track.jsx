import { FLOW, stepIndex } from '../lib/orders';

/**
 * Where the parcel is.
 *
 * A horizontal stepper, not a bulleted list. The four states are one journey
 * with a direction, and a list of four rows says nothing about how far along
 * anything is — the whole point is the distance between "paid" and "at your
 * door", which a filled rail shows at a glance and a list does not.
 *
 * Horizontal at every width: four icons fit inside 300px, so a phone gets the
 * same shape as a desktop instead of a different component to maintain.
 * The rail runs right to left, like the language.
 */

const glyph = {
  card: <><rect x="2.5" y="5.5" width="19" height="13" rx="2.5" /><path d="M2.5 10h19" /></>,
  box: <><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></>,
  truck: <><path d="M2.5 7.5h11v9h-11z" /><path d="M13.5 11h4l3 3v2.5h-7z" /><circle cx="6.5" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>,
  home: <><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" /><path d="M9.5 21v-6h5v6" /></>,
  x: <path d="M6 6l12 12M18 6 6 18" />,
};

const when = (iso) => new Date(iso).toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' });

export default function Track({ order, compact = false }) {
  if (order.status === 'canceled') {
    const at = order.history.find((h) => h.status === 'canceled')?.at;
    return (
      <div className="track-canceled">
        <span className="track-mark"><Glyph name="x" /></span>
        <div>
          <b>سفارش لغو شد</b>
          {at && <small>{when(at)}</small>}
        </div>
      </div>
    );
  }

  const done = stepIndex(order.status);
  // The rail is drawn once, behind everything, and filled to the current step.
  // Four steps means three gaps, so progress is measured over `length - 1`.
  const progress = FLOW.length > 1 ? (done / (FLOW.length - 1)) * 100 : 0;

  return (
    <ol className={`track2 ${compact ? 'compact' : ''}`} aria-label="مسیر سفارش">
      <span className="track2-rail" aria-hidden="true">
        <i style={{ inlineSize: `${progress}%` }} />
      </span>

      {FLOW.map((s, i) => {
        const hit = order.history.find((h) => h.status === s.key);
        const state = i < done ? 'done' : i === done ? 'now' : 'todo';
        return (
          <li key={s.key} className={state}>
            <span className="track2-node">
              <Glyph name={s.icon} />
            </span>
            <b>{s.short}</b>
            {hit ? <small>{when(hit.at)}</small> : <small className="muted">—</small>}
            {!compact && state !== 'todo' && <p>{s.customer}</p>}
          </li>
        );
      })}
    </ol>
  );
}

function Glyph({ name }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {glyph[name] ?? glyph.box}
    </svg>
  );
}
