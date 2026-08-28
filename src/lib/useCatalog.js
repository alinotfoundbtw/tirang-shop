import { useSyncExternalStore } from 'react';
import { allProducts, subscribe } from './catalog';

/**
 * The live catalog, re-rendering when the owner adds or removes a product.
 *
 * Kept out of catalog.js so that file stays free of React: retrieval imports
 * it, and scripts/rag-eval.mjs imports retrieval under plain Node.
 *
 * allProducts() returns the same cached array until something changes, which
 * is exactly the identity useSyncExternalStore needs to avoid looping.
 */
export const useCatalog = () => useSyncExternalStore(subscribe, allProducts, allProducts);
