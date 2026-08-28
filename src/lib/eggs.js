/* ───────────────────────────────────────────────────────────────
   Easter eggs.

   Self-contained on purpose: one import, one call, no component knows
   this file exists. Everything it does is either a console message or a
   data-attribute on <html> that CSS reacts to, so deleting the import
   removes every trace of it.

   Nothing here changes what the shop does. An egg that hides a real
   control, breaks the back button or costs a shopper a tap is not an
   egg, it is a bug with a joke attached.
   ─────────────────────────────────────────────────────────────── */

const TEE = 'M15 4l6 2v5h-3v8a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-8h-3v-5l6 -2a3 3 0 0 0 6 0';

/* ── 1. A signature in the console ─────────────────────── */
function signature() {
  const brand = [
    'padding: 10px 16px',
    'background: linear-gradient(135deg, #2B45E0, #7d90ff)',
    'color: #fff',
    'font: 700 14px/1.4 system-ui, sans-serif',
    'border-radius: 10px 10px 0 0',
  ].join(';');
  const body = [
    'padding: 12px 16px',
    'background: #14161b',
    'color: #cfd4e6',
    'font: 12px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace',
    'border-radius: 0 0 10px 10px',
  ].join(';');

  console.log(
    '%cتیرنگ — TIRANG%c\n' +
      'A Persian t-shirt shop. Every colour has its own photograph.\n\n' +
      '  retrieval   BM25 over the catalog, no model, ~1ms\n' +
      '  photos      served from this origin, not hotlinked\n' +
      '  theme       follows your system until you say otherwise\n\n' +
      'Two things are hidden in here. One needs a keyboard from 1986,\n' +
      'the other needs you to be impatient with the logo.',
    brand,
    body
  );
}

/* ── 2. Konami → it rains t-shirts ─────────────────────── */
const SEQUENCE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

function rain() {
  if (document.querySelector('.egg-rain')) return;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const box = document.createElement('div');
  box.className = 'egg-rain';
  box.setAttribute('aria-hidden', 'true');

  const count = still ? 8 : 26;
  for (let i = 0; i < count; i++) {
    const tee = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tee.setAttribute('viewBox', '0 0 24 24');
    tee.setAttribute('fill', 'none');
    tee.setAttribute('stroke', 'currentColor');
    tee.setAttribute('stroke-width', '1.6');
    tee.setAttribute('stroke-linejoin', 'round');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', TEE);
    tee.appendChild(path);

    // Spread across the width, stagger the starts, vary size and spin so it
    // reads as a shower rather than a row of clones falling in step.
    tee.style.left = `${Math.random() * 100}%`;
    tee.style.animationDelay = `${Math.random() * 1.6}s`;
    tee.style.animationDuration = `${2.6 + Math.random() * 2.2}s`;
    tee.style.setProperty('--spin', `${Math.random() * 720 - 360}deg`);
    tee.style.setProperty('--size', `${18 + Math.random() * 22}px`);
    tee.style.opacity = String(0.5 + Math.random() * 0.5);
    box.appendChild(tee);
  }

  document.body.appendChild(box);
  setTimeout(() => box.remove(), still ? 1200 : 5600);
}

function konami() {
  let at = 0;
  window.addEventListener('keydown', (e) => {
    // Ignore anything typed into a field — this is a page gesture, not input.
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const want = SEQUENCE[at];
    const hit = e.key === want || e.key.toLowerCase() === want;
    at = hit ? at + 1 : e.key === SEQUENCE[0] ? 1 : 0;
    if (at === SEQUENCE.length) {
      at = 0;
      rain();
    }
  });
}

/* ── 3. Seven taps on the logo → the seams show ─────────
   A dashed outline over every panel, the way a pattern piece is marked
   before it is cut. CSS does all of it; this only sets the flag. */
function seams() {
  let taps = 0;
  let timer = null;

  document.addEventListener('click', (e) => {
    if (!e.target.closest?.('.logo')) return;
    taps += 1;
    clearTimeout(timer);
    timer = setTimeout(() => { taps = 0; }, 900);

    if (taps >= 7) {
      taps = 0;
      const root = document.documentElement;
      const on = root.dataset.egg === 'seams';
      if (on) delete root.dataset.egg;
      else root.dataset.egg = 'seams';
    }
  });

  // Any way out is better than only the way in.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') delete document.documentElement.dataset.egg;
  });
}

let started = false;

/** Call once, from the entry point. Safe to call again; it will not stack. */
export function initEggs() {
  if (started || typeof window === 'undefined') return;
  started = true;

  // The signature is for people who open the console on the live site. In dev
  // it would just be noise on top of every hot reload.
  if (import.meta.env.PROD) signature();

  konami();
  seams();
}
