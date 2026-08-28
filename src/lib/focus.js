/**
 * Keeps Tab inside an open overlay.
 *
 * Without this, tabbing out of the search panel or the quick-view sheet walks
 * into the page behind it — which is still there, still scrolled, and now
 * being operated by someone who cannot see where their focus went. Escape and
 * the scrim already close these; this makes the keyboard agree with them.
 *
 * Returns focus to whatever was focused before the overlay opened.
 */
const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

export function trapFocus(container) {
  if (!container) return () => {};
  const previous = document.activeElement;

  const onKey = (e) => {
    if (e.key !== 'Tab') return;
    const items = [...container.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    // Wrap at both ends, and pull focus in if it has already escaped.
    if (e.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
      e.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', onKey);
  return () => {
    document.removeEventListener('keydown', onKey);
    if (previous instanceof HTMLElement && document.contains(previous)) previous.focus();
  };
}
