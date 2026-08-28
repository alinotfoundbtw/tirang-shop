/**
 * The live catalog: the seed products plus whatever the owner has added.
 *
 * `data/products.js` stays the shipped catalog and is never written to.
 * Anything created in the panel lands here, in front of it, so a new product
 * shows up first — and so deleting the storage key restores the demo exactly.
 *
 * Retrieval reads through this too, which is the point: a product you just
 * added has to be findable, or the panel has produced something the shop
 * cannot sell.
 */

import { products as seed } from '../data/products.js';

const KEY = 'tirang.catalog.v1';

/* Node has no localStorage, and rag-eval.mjs imports this chain to check
   retrieval without a browser. There, the catalog is simply the seed. */
const hasStore = typeof localStorage !== 'undefined';

const listeners = new Set();
let cache = null;

function readCustom() {
  if (!hasStore) return [];
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function writeCustom(list) {
  if (!hasStore) return { ok: true };
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return { ok: true };
  } catch (err) {
    // Photos are what fills this up. Say so, rather than failing silently and
    // leaving the owner to discover on reload that the product never saved.
    const full = err?.name === 'QuotaExceededError' || err?.code === 22;
    return {
      ok: false,
      error: full
        ? 'حافظهٔ مرورگر پر شد. چند عکس را کوچک‌تر کنید یا محصولی را حذف کنید.'
        : 'ذخیره نشد.',
    };
  }
}

function rebuild() {
  cache = [...readCustom(), ...seed];
  listeners.forEach((fn) => fn());
  return cache;
}

/** Every product the shop currently sells, newest additions first. */
export function allProducts() {
  if (!cache) rebuild();
  return cache;
}

export const customProducts = () => readCustom();
export const isCustom = (id) => readCustom().some((p) => p.id === id);
export const findProduct = (slug) => allProducts().find((p) => p.slug === slug) ?? null;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function addProduct(product) {
  const res = writeCustom([product, ...readCustom()]);
  if (res.ok) rebuild();
  return res;
}

export function updateProduct(id, patch) {
  const res = writeCustom(readCustom().map((p) => (p.id === id ? { ...p, ...patch } : p)));
  if (res.ok) rebuild();
  return res;
}

export function removeProduct(id) {
  const res = writeCustom(readCustom().filter((p) => p.id !== id));
  if (res.ok) rebuild();
  return res;
}
