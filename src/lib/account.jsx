import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/* ───────────────────────────────────────────────────────────────
   DEMO ACCOUNTS — no server, no verification, no password.

   Everything here lives in this one browser's localStorage. Nothing is
   sent anywhere, nothing is shared between devices, and signing in
   proves nothing about who you are.

   There is deliberately no password field anywhere in this flow. The
   real system is planned as an SMS one-time code (docs/PROMPT-ADDITIVE
   §4), so a password would be a field that never ships — and a
   password box on a public URL invites someone to type one they use
   elsewhere, which a localStorage demo has no business holding.

   Replace `signIn` and `signUp` with real calls when the backend lands;
   nothing else in the app reads storage directly.
   ─────────────────────────────────────────────────────────────── */

const KEY = 'tirang.account.v1';
const Ctx = createContext(null);

const BLANK = {
  user: null,
  addresses: [],
  notify: {
    newProduct: true,
    restock: true,
    orders: true,
    telegram: { handle: '', linked: false },
  },
  myReviews: [],
};

const read = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved ? { ...BLANK, ...saved, notify: { ...BLANK.notify, ...saved.notify } } : BLANK;
  } catch {
    return BLANK;
  }
};

const write = (value) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch { /* private mode — this session keeps it in memory */ }
};

/** ۰۹۱۲۳۴۵۶۷۸۹ and 09123456789 are the same number. */
export const normalizePhone = (raw = '') => {
  const fa = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
  return String(raw).replace(/[۰-۹]/g, (d) => fa[d]).replace(/\D/g, '');
};

export const validPhone = (raw) => /^09\d{9}$/.test(normalizePhone(raw));

const uid = () => Math.random().toString(36).slice(2, 10);

export function AccountProvider({ children }) {
  const [state, setState] = useState(read);

  useEffect(() => write(state), [state]);

  const patch = useCallback((fn) => setState((s) => ({ ...s, ...fn(s) })), []);

  const signUp = useCallback(
    ({ name, phone, email }) =>
      patch(() => ({
        user: {
          name: name.trim(),
          phone: normalizePhone(phone),
          email: email?.trim() || '',
          joined: new Date().toISOString(),
        },
      })),
    [patch]
  );

  /* No verification: this only checks that an account was created in this
     browser with this number. It is a demo of the shape of a session, not of
     its security. */
  const signIn = useCallback(
    (phone) => {
      const wanted = normalizePhone(phone);
      const saved = read().user;
      if (saved && saved.phone === wanted) {
        setState((s) => ({ ...s, user: saved }));
        return { ok: true };
      }
      return { ok: false, reason: 'no-account' };
    },
    []
  );

  const signOut = useCallback(() => patch(() => ({ user: null })), [patch]);

  const saveAddress = useCallback(
    (address) =>
      patch((s) => {
        const id = address.id || uid();
        const next = { ...address, id };
        const list = address.id ? s.addresses.map((a) => (a.id === id ? next : a)) : [...s.addresses, next];
        // Exactly one default, always — and the first one added becomes it.
        const withDefault = list.length === 1 || next.isDefault
          ? list.map((a) => ({ ...a, isDefault: a.id === id }))
          : list;
        return { addresses: withDefault };
      }),
    [patch]
  );

  const removeAddress = useCallback(
    (id) =>
      patch((s) => {
        const list = s.addresses.filter((a) => a.id !== id);
        // Removing the default promotes the next one rather than leaving none.
        if (list.length && !list.some((a) => a.isDefault)) list[0] = { ...list[0], isDefault: true };
        return { addresses: list };
      }),
    [patch]
  );

  const setDefaultAddress = useCallback(
    (id) => patch((s) => ({ addresses: s.addresses.map((a) => ({ ...a, isDefault: a.id === id })) })),
    [patch]
  );

  const setNotify = useCallback(
    (partial) => patch((s) => ({ notify: { ...s.notify, ...partial } })),
    [patch]
  );

  const addReview = useCallback(
    ({ product, rating, body }) =>
      patch((s) => ({
        myReviews: [
          {
            id: `my-${uid()}`,
            product,
            rating,
            body: body.trim(),
            date: new Date().toLocaleDateString('fa-IR', { day: 'numeric', month: 'long' }),
            mine: true,
          },
          ...s.myReviews.filter((r) => r.product !== product),
        ],
      })),
    [patch]
  );

  const removeReview = useCallback(
    (product) => patch((s) => ({ myReviews: s.myReviews.filter((r) => r.product !== product) })),
    [patch]
  );

  const value = useMemo(
    () => ({
      ...state,
      signedIn: Boolean(state.user),
      signUp,
      signIn,
      signOut,
      saveAddress,
      removeAddress,
      setDefaultAddress,
      setNotify,
      addReview,
      removeReview,
    }),
    [state, signUp, signIn, signOut, saveAddress, removeAddress, setDefaultAddress, setNotify, addReview, removeReview]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAccount = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAccount باید داخل AccountProvider استفاده شود');
  return ctx;
};
