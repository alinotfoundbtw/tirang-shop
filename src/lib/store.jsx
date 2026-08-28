import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { products } from '../data/products';

const CART = 'tirang.cart.v1';
const WISH = 'tirang.wish.v1';
const SEEN = 'tirang.seen.v1';
const ShopCtx = createContext(null);

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* private mode — state stays in memory for this session */ }
};

function reducer(state, action) {
  switch (action.type) {
    case 'add': {
      const key = `${action.id}|${action.color}|${action.size}`;
      const found = state.find((l) => l.key === key);
      if (found) return state.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + (action.qty || 1), 10) } : l));
      return [...state, { key, id: action.id, color: action.color, size: action.size, qty: action.qty || 1 }];
    }
    case 'qty':
      return state.map((l) => (l.key === action.key ? { ...l, qty: Math.max(0, l.qty + action.by) } : l)).filter((l) => l.qty > 0);
    case 'remove':
      return state.filter((l) => l.key !== action.key);
    case 'clear':
      return [];
    default:
      return state;
  }
}

export const FREE_SHIPPING = 1_500_000;

export function ShopProvider({ children }) {
  const [lines, dispatch] = useReducer(reducer, null, () => read(CART, []));
  const [wish, setWish] = useState(() => read(WISH, []));
  const [seen, setSeen] = useState(() => read(SEEN, []));
  const [toasts, setToasts] = useState([]);

  useEffect(() => write(CART, lines), [lines]);
  useEffect(() => write(WISH, wish), [wish]);
  useEffect(() => write(SEEN, seen), [seen]);

  const toast = useCallback((text) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const toggleWish = useCallback(
    (id) =>
      setWish((w) => {
        const on = w.includes(id);
        toast(on ? 'از علاقه‌مندی‌ها حذف شد' : 'به علاقه‌مندی‌ها اضافه شد');
        return on ? w.filter((x) => x !== id) : [id, ...w];
      }),
    [toast]
  );

  // Keeps the last eight products viewed, most recent first.
  const markSeen = useCallback((id) => setSeen((s) => [id, ...s.filter((x) => x !== id)].slice(0, 8)), []);

  const detailed = useMemo(
    () => lines.map((l) => ({ ...l, product: products.find((p) => p.id === l.id) })).filter((l) => l.product),
    [lines]
  );

  const count = detailed.reduce((s, l) => s + l.qty, 0);
  const subtotal = detailed.reduce((s, l) => s + l.qty * l.product.price, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING ? 0 : 79000;

  const value = {
    lines: detailed, dispatch, count, subtotal, shipping,
    wish, toggleWish, seen, markSeen,
    toast, toasts,
  };
  return <ShopCtx.Provider value={value}>{children}</ShopCtx.Provider>;
}

export const useShop = () => {
  const ctx = useContext(ShopCtx);
  if (!ctx) throw new Error('useShop باید داخل ShopProvider استفاده شود');
  return ctx;
};

/** Fakes a network round-trip so skeletons and error states are real code paths,
 *  not decoration. Swap the body for fetch() and everything else keeps working. */
export function useAsync(fn, deps = [], { delay = 380 } = {}) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: null, data: null });
    const t = setTimeout(() => {
      try {
        const data = fn();
        if (alive) setState({ loading: false, error: null, data });
      } catch (e) {
        if (alive) setState({ loading: false, error: e.message || 'خطای ناشناخته', data: null });
      }
    }, delay);
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);
  return { ...state, retry: () => setNonce((n) => n + 1) };
}

/* Lives in lib/sizing.js so retrieval can use the same table without
   importing React. Re-exported here because callers already import it. */
export { suggestSize } from './sizing';
