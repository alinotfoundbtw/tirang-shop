/**
 * Category icons, from Tabler Icons 3.46.0 — MIT licensed.
 * https://github.com/tabler/tabler-icons
 *
 * Vendored rather than installed: six icons do not justify a dependency, and
 * this keeps them on our own origin, which matters for a shop served to a
 * network that blocks half the CDNs.
 *
 * They come from one family — 24×24 grid, 2px stroke, round caps — which is
 * the point. Six icons drawn by hand look like six icons; six from one set
 * look like a set. Paths are copied verbatim; if you swap one, take it from
 * the same family or the row stops matching.
 */

const marks = {
  // tabler: hanger-2 — a shirt hanging loose, for the oversize cut
  oversize: (
    <>
      <path d="M12 9l-7.971 4.428a2 2 0 0 0 -1.029 1.749v.823a2 2 0 0 0 2 2h1" />
      <path d="M18 18h1a2 2 0 0 0 2 -2v-.823a2 2 0 0 0 -1.029 -1.749l-7.971 -4.428c-1.457 -.81 -1.993 -2.333 -2 -4a2 2 0 1 1 4 0" />
      <path d="M6 18a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2l0 -1" />
    </>
  ),
  // tabler: shirt
  basic: <path d="M15 4l6 2v5h-3v8a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-8h-3v-5l6 -2a3 3 0 0 0 6 0" />,
  // tabler: palette — the printed ones
  graphic: (
    <>
      <path d="M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25" />
      <path d="M7.5 10.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M11.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
      <path d="M15.5 10.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    </>
  ),
  // tabler: woman
  women: (
    <>
      <path d="M10 16v5" />
      <path d="M14 16v5" />
      <path d="M8 16h8l-2 -7h-4l-2 7" />
      <path d="M5 11c1.667 -1.333 3.333 -2 5 -2" />
      <path d="M19 11c-1.667 -1.333 -3.333 -2 -5 -2" />
      <path d="M10 4a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    </>
  ),
  // tabler: mood-kid
  kids: (
    <>
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M9 10l.01 0" />
      <path d="M15 10l.01 0" />
      <path d="M9.5 15a3.5 3.5 0 0 0 5 0" />
      <path d="M12 3a2 2 0 0 0 0 4" />
    </>
  ),
  // tabler: packages
  pack: (
    <>
      <path d="M7 16.5l-5 -3l5 -3l5 3v5.5l-5 3l0 -5.5" />
      <path d="M2 13.5v5.5l5 3" />
      <path d="M7 16.545l5 -3.03" />
      <path d="M17 16.5l-5 -3l5 -3l5 3v5.5l-5 3l0 -5.5" />
      <path d="M12 19l5 3" />
      <path d="M17 16.5l5 -3" />
      <path d="M12 13.5v-5.5l-5 -3l5 -3l5 3v5.5" />
      <path d="M7 5.03v5.455" />
      <path d="M12 8l5 -3" />
    </>
  ),
};

export default function CategoryMark({ slug, size = 26 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {marks[slug] ?? marks.basic}
    </svg>
  );
}
