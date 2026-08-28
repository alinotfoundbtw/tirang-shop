/**
 * Shared-element navigation.
 *
 * A view transition morphs the two elements that carry the same
 * `view-transition-name`, which means exactly one element may hold it at the
 * moment navigation starts — a duplicate makes the browser skip the whole
 * transition. The product page's gallery claims the name from CSS; every
 * other candidate claims it here, imperatively.
 *
 * Imperatively, and not through React state, because this has to be settled
 * *before* the navigation begins. React Router calls a Link's own onClick
 * synchronously ahead of navigating, so writing the style here is ordered;
 * a setState would only be scheduled, and might land after the browser has
 * already snapshotted the outgoing page.
 */
export const MORPH = 'product-photo';

/** Give `el` the transition name and take it off everyone else. */
export function armMorph(el) {
  document.querySelectorAll('[data-morph]').forEach((node) => {
    // 'none' also has to beat the gallery's name, which comes from a rule.
    node.style.viewTransitionName = 'none';
  });
  if (el) el.style.viewTransitionName = MORPH;
}
