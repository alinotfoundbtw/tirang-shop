import { useEffect, useRef, useState } from 'react';
import { Photo } from './States';
import { fa } from '../lib/format';

/**
 * Product gallery.
 *
 * Desktop: hovering scales the image and tracks the pointer — a magnifier with
 * no second request, since the source file is already 900px wide.
 * Touch: tap opens the lightbox, which supports pinch, double-tap, drag-pan and
 * swipe between shots. Two different input models, one component.
 */
export default function Gallery({ photos, alt }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [open, setOpen] = useState(false);
  const mainRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => setI(0), [photos]);

  const move = (e) => {
    const box = mainRef.current?.getBoundingClientRect();
    const img = mainRef.current?.querySelector('img');
    if (!box || !img) return;
    const x = ((e.clientX - box.left) / box.width) * 100;
    const y = ((e.clientY - box.top) / box.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
  };

  const fine = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;
  const step = (by) => setI((n) => (n + by + photos.length) % photos.length);

  return (
    <>
      <div className="gallery">
        <div
          ref={mainRef}
          className={`gal-main ${zoom ? 'zooming' : ''}`}
          onMouseEnter={() => fine && setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={(e) => zoom && move(e)}
          onClick={() => setOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); }
            if (e.key === 'ArrowLeft') step(1);
            if (e.key === 'ArrowRight') step(-1);
          }}
          aria-label={`${alt} — برای بزرگ‌نمایی باز کنید`}
        >
          <Photo src={photos[i]} alt={alt} eager sizes="(max-width: 700px) 100vw, 560px" />
          <span className="gal-hint">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4M11 8v6M8 11h6" />
            </svg>
            {fine ? 'برای بزرگ‌نمایی نگه دارید' : 'برای بزرگ‌نمایی بزنید'}
          </span>
          {photos.length > 1 && (
            <>
              <button className="gal-nav prev" aria-label="تصویر قبلی" onClick={(e) => { e.stopPropagation(); step(1); }}>›</button>
              <button className="gal-nav next" aria-label="تصویر بعدی" onClick={(e) => { e.stopPropagation(); step(-1); }}>‹</button>
            </>
          )}
        </div>

        {photos.length > 1 && (
          <div className="thumbs">
            {photos.map((p, n) => (
              <button key={p} aria-current={n === i} aria-label={`تصویر ${fa(n + 1)}`} onClick={() => setI(n)}>
                <Photo src={p} alt="" sizes="62px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <Lightbox photos={photos} alt={alt} start={i} onClose={() => setOpen(false)} onIndex={setI} imgRef={imgRef} />
      )}
    </>
  );
}

function Lightbox({ photos, alt, start, onClose, onIndex }) {
  const [i, setI] = useState(start);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const gesture = useRef(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const key = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(1);
      if (e.key === 'ArrowRight') go(-1);
    };
    window.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', key);
    };
  });

  const go = (by) => {
    const next = (i + by + photos.length) % photos.length;
    setI(next);
    onIndex(next);
    reset();
  };
  const reset = () => { setScale(1); setPan({ x: 0, y: 0 }); };

  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const onStart = (e) => {
    const t = e.touches;
    if (t.length === 2) gesture.current = { mode: 'pinch', d: dist(t), base: scale };
    else gesture.current = { mode: 'drag', x: t[0].clientX, y: t[0].clientY, pan: { ...pan } };
    setPanning(true);
  };

  const onMove = (e) => {
    const g = gesture.current;
    if (!g) return;
    const t = e.touches;
    if (g.mode === 'pinch' && t.length === 2) {
      setScale(Math.min(4, Math.max(1, g.base * (dist(t) / g.d))));
    } else if (g.mode === 'drag' && t.length === 1) {
      const dx = t[0].clientX - g.x;
      const dy = t[0].clientY - g.y;
      if (scale > 1) setPan({ x: g.pan.x + dx, y: g.pan.y + dy });
      else if (Math.abs(dx) > 60) { go(dx > 0 ? 1 : -1); gesture.current = null; }
    }
  };

  const onEnd = () => {
    gesture.current = null;
    setPanning(false);
    if (scale <= 1) setPan({ x: 0, y: 0 });
  };

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`گالری ${alt}`}>
      <div className="lightbox-bar">
        <span className="num">{fa(i + 1)} / {fa(photos.length)}</span>
        <div className="row" style={{ gap: 'var(--s2)' }}>
          <button className="icon-btn" style={{ color: 'inherit' }} aria-label="کوچک‌نمایی" onClick={() => setScale((s) => Math.max(1, s - 0.6))}>−</button>
          <button className="icon-btn" style={{ color: 'inherit' }} aria-label="بزرگ‌نمایی" onClick={() => setScale((s) => Math.min(4, s + 0.6))}>+</button>
          <button className="icon-btn" style={{ color: 'inherit' }} aria-label="بستن" onClick={onClose}>✕</button>
        </div>
      </div>

      <div
        className="lightbox-stage"
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onDoubleClick={() => (scale > 1 ? reset() : setScale(2.4))}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <img
          src={photos[i]}
          alt={`${alt} — تصویر ${fa(i + 1)}`}
          className={panning ? 'panning' : ''}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` }}
          draggable="false"
        />
      </div>

      <div className="lightbox-foot">
        {photos.map((p, n) => (
          <button key={p} aria-current={n === i} aria-label={`تصویر ${fa(n + 1)}`} onClick={() => { setI(n); onIndex(n); reset(); }} />
        ))}
      </div>
    </div>
  );
}
