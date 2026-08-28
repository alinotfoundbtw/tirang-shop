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
/* Seed products live in a source file and cannot be rewritten, so an edit to
   one is stored as a patch laid over it at read time. Deleting this key puts
   the shipped catalog back exactly as it was. */
const EDITS = 'tirang.catalog.edits.v1';

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

function readEdits() {
  if (!hasStore) return {};
  try {
    const saved = JSON.parse(localStorage.getItem(EDITS));
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function writeEdits(map) {
  if (!hasStore) return { ok: true };
  try {
    localStorage.setItem(EDITS, JSON.stringify(map));
    return { ok: true };
  } catch {
    return { ok: false, error: 'حافظهٔ مرورگر پر شد.' };
  }
}

function rebuild() {
  const edits = readEdits();
  const apply = (p) => (edits[p.id] ? { ...p, ...edits[p.id] } : p);
  cache = [...readCustom().map(apply), ...seed.map(apply)];
  listeners.forEach((fn) => fn());
  return cache;
}

/** True when this product carries owner edits on top of what shipped. */
export const isEdited = (id) => Boolean(readEdits()[id]);

/** Puts a seed product back to how it shipped. */
export function resetProduct(id) {
  const edits = readEdits();
  delete edits[id];
  const res = writeEdits(edits);
  if (res.ok) rebuild();
  return res;
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

/**
 * Edits a product.
 *
 * One the owner created is rewritten in place. One that shipped with the
 * template is patched over instead, because its real definition is a source
 * file this cannot reach — and an edit that silently vanished on the next
 * deploy would be worse than one that is recorded as an override.
 */
export function updateProduct(id, patch) {
  const own = readCustom();
  if (own.some((p) => p.id === id)) {
    const res = writeCustom(own.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    if (res.ok) rebuild();
    return res;
  }
  const edits = readEdits();
  const res = writeEdits({ ...edits, [id]: { ...edits[id], ...patch } });
  if (res.ok) rebuild();
  return res;
}

export function removeProduct(id) {
  const res = writeCustom(readCustom().filter((p) => p.id !== id));
  if (res.ok) rebuild();
  return res;
}
