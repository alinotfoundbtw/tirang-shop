import { useState } from 'react';

/** Loader: a tee outline drawing itself. The shop's own object, not a spinner. */
export function Loader({ label = 'در حال آماده‌سازی…' }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <svg className="loader" width="86" height="72" viewBox="0 0 86 72" aria-hidden="true">
        <path d="M31 6 L14 14 L6 30 L18 36 L18 66 L68 66 L68 36 L80 30 L72 14 L55 6 Q43 18 31 6 Z" />
      </svg>
      <p className="muted">{label}</p>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid-products" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div className="skel-card" key={i}>
          <div className="skel" style={{ aspectRatio: '3 / 4', borderRadius: 0 }} />
          <div style={{ padding: 'var(--s3)', display: 'grid', gap: 8 }}>
            <div className="skel" style={{ height: 14, width: '75%' }} />
            <div className="skel" style={{ height: 11, width: '45%' }} />
            <div className="skel" style={{ height: 14, width: '55%', marginTop: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Errors say what happened and what to do. No apology, no shrug. */
export function ErrorState({ message = 'محصولات بارگذاری نشد.', onRetry }) {
  return (
    <div className="state" role="alert">
      <svg width="56" height="52" viewBox="0 0 86 72" aria-hidden="true">
        <path
          d="M31 6 L14 14 L6 30 L18 36 L18 66 L68 66 L68 36 L80 30 L72 14 L55 6 Q43 18 31 6 Z"
          fill="none" stroke="var(--line-strong)" strokeWidth="2.5" strokeLinejoin="round"
        />
        <path d="M34 40 L52 56 M52 40 L34 56" stroke="var(--cherry)" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
      <h2>این یکی بالا نیامد</h2>
      <p>{message} اتصال اینترنت را بررسی کنید و دوباره امتحان کنید.</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          دوباره تلاش کن
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="state">
      <svg width="60" height="52" viewBox="0 0 86 72" aria-hidden="true">
        <path
          d="M31 6 L14 14 L6 30 L18 36 L18 66 L68 66 L68 36 L80 30 L72 14 L55 6 Q43 18 31 6 Z"
          fill="none" stroke="var(--line-strong)" strokeWidth="2.5" strokeLinejoin="round" strokeDasharray="5 7"
        />
      </svg>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

/**
 * Photo — fades in when decoded so a slow connection shows a tinted placeholder
 * instead of a white gap, and says so plainly if the image never arrives.
 */
export function Photo({ src, alt, eager = false, tone, sizes = '(max-width: 700px) 50vw, 300px' }) {
  const [state, setState] = useState('loading');
  return (
    <div className={`ph ${state === 'failed' ? 'failed' : ''}`} style={tone ? { background: tone } : undefined}>
      {state !== 'failed' && (
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          className={state === 'ready' ? 'ready' : ''}
          onLoad={() => setState('ready')}
          onError={() => setState('failed')}
        />
      )}
    </div>
  );
}

/** Warms the browser cache for the other colorway before the shopper taps it. */
export const preload = (src) => {
  if (!src) return;
  const img = new Image();
  img.src = src;
};
