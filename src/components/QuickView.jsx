import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Photo } from './States';
import { ColorPicker, SizePicker, useVariant } from './Buy';
import { useShop } from '../lib/store';
import { toman, fa } from '../lib/format';

/** Buy from the grid without losing your place in it. */
export default function QuickView({ product, onClose }) {
  const { color, size, setSize, ci, pickColor, inStock } = useVariant(product);
  const { dispatch, toast } = useShop();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const key = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', key);
    };
  }, [onClose]);

  /* The grab handle drew a bar that promised a drag and did nothing. Now it
     drags: follow the finger down, and let go past the threshold to dismiss.
     Only the handle is draggable — claiming the whole sheet would fight the
     scrolling inside it. */
  const [drag, setDrag] = useState(0);
  const from = useRef(null);

  const dragStart = (e) => { from.current = e.touches[0].clientY; };
  const dragMove = (e) => {
    if (from.current == null) return;
    // Downward only; an upward pull should not lift the sheet off its edge.
    setDrag(Math.max(0, e.touches[0].clientY - from.current));
  };
  const dragEnd = () => {
    from.current = null;
    if (drag > 110) onClose();
    else setDrag(0);
  };

  const add = () => {
    dispatch({ type: 'add', id: product.id, color: color.name, size });
    toast(`${product.name} — ${color.name}، ${size} به سبد اضافه شد`);
    onClose();
  };

  return (
    <div
      className="modal-scrim"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={drag ? { background: `color-mix(in srgb, var(--ink) ${Math.max(8, 55 - drag * 0.3)}%, transparent)` } : undefined}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`نگاه سریع ${product.name}`}
        style={drag ? { transform: `translateY(${drag}px)`, transition: 'none', animation: 'none' } : undefined}
      >
        <div
          className="modal-head"
          onTouchStart={dragStart}
          onTouchMove={dragMove}
          onTouchEnd={dragEnd}
          onTouchCancel={dragEnd}
        >
          <div className="modal-grab" />
          <button className="modal-close" onClick={onClose} aria-label="بستن">✕</button>
        </div>
        <div className="modal-grid">
          <div className="modal-photo">
            <Photo src={color.photos[0]} alt={`${product.name} — ${color.name}`} eager tone={color.hex} sizes="(max-width: 699px) 100vw, 340px" />
          </div>

          <div className="stack" style={{ gap: 'var(--s4)' }}>
            <div>
              <h2 style={{ fontSize: 'var(--t-h2)' }}>{product.name}</h2>
              <p className="muted" style={{ fontSize: 'var(--t-sm)' }}>{product.subtitle}</p>
            </div>
            <div className="price-now num">
              {toman(product.price)}
              {product.oldPrice && <s>{toman(product.oldPrice, { unit: false })}</s>}
            </div>

            <ColorPicker product={product} ci={ci} onPick={pickColor} />
            <SizePicker product={product} color={color} size={size} onPick={setSize} />

            <button className="btn btn-primary btn-block" onClick={add} disabled={!inStock}>
              {inStock ? 'افزودن به سبد' : 'این ترکیب موجود نیست'}
            </button>
            <Link to={`/p/${product.slug}`} className="btn btn-ghost btn-block" onClick={onClose}>
              دیدن جزئیات کامل
            </Link>
            <p className="muted" style={{ fontSize: 'var(--t-xs)', textAlign: 'center' }}>
              تعویض سایز رایگان تا ۷ روز · ⭐ {fa(product.rating.toFixed(1).replace('.', '٫'))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
