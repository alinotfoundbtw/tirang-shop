import { useEffect, useLayoutEffect, useRef, useState } from 'react';

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
 *
 * Swapping colourway is the shop's signature move, so the swap gets its own
 * treatment: the element keeps painting the old photo, dimmed, until the new
 * one has actually decoded, then cuts to it at full strength. Pointing `src`
 * straight at the new file instead would blank the frame for as long as the
 * network took — the busier the shopper, the worse it looked.
 */
export function Photo({ src, alt, eager = false, tone, sizes = '(max-width: 700px) 50vw, 300px' }) {
  const [state, setState] = useState('loading');
  const [shown, setShown] = useState(src);
  const [swapping, setSwapping] = useState(false);
  const node = useRef(null);

  /* A cached image is already complete on mount and fires no load event, so
     without this it would sit at opacity 0 until something else re-rendered.
     That is most visible arriving from a shared-element transition: the photo
     morphs into place and lands on an empty frame. Layout effect, not effect,
     so the correction happens before the browser paints. */
  useLayoutEffect(() => {
    if (node.current?.complete && node.current.naturalWidth > 0) setState('ready');
  }, [shown]);

  useEffect(() => {
    if (src === shown) return;
    let dropped = false;
    setSwapping(true);
    const settle = () => {
      if (dropped) return;
      setShown(src);
      setSwapping(false);
    };
    const img = new Image();
    img.src = src;
    // decode() resolves once the bitmap is ready to paint, so the cut is clean.
    // A failure settles too — the <img> below is what reports a broken photo.
    if (img.decode) img.decode().then(settle, settle);
    else { img.onload = settle; img.onerror = settle; }
    return () => { dropped = true; };
  }, [src, shown]);

  return (
    <div className={`ph ${state === 'failed' ? 'failed' : ''}`} style={tone ? { background: tone } : undefined}>
      {state !== 'failed' && (
        <img
          ref={node}
          src={shown}
          alt={alt}
          sizes={sizes}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
          className={`${state === 'ready' ? 'ready' : ''}${swapping ? ' swapping' : ''}`}
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
