/**
 * A drawn mark per category, keyed by slug.
 *
 * Every one of these is the same tee silhouette with one thing changed — the
 * shoulder line, the neck, the print, the count — so the set reads as one
 * family rather than six clip-art icons. They inherit `currentColor`, so a
 * re-skin carries them along with everything else.
 */

const shell = 'M31 6 L14 14 L6 30 L18 36 L18 66 L68 66 L68 36 L80 30 L72 14 L55 6 Q43 18 31 6 Z';

const marks = {
  // Dropped shoulder, wider body: the oversize cut.
  oversize: (
    <>
      <path d="M29 6 L10 15 L2 32 L15 38 L15 66 L71 66 L71 38 L84 32 L76 15 L57 6 Q43 19 29 6 Z" />
      <path d="M15 38 L15 46M71 38 L71 46" opacity="0.45" />
    </>
  ),
  // The plain one. Nothing but the crew neck.
  basic: (
    <>
      <path d={shell} />
      <path d="M31 6 Q43 18 55 6" opacity="0.55" />
    </>
  ),
  // A print block on the chest.
  graphic: (
    <>
      <path d={shell} />
      <rect x="32" y="30" width="22" height="20" rx="2.5" opacity="0.9" />
      <path d="M36 44 L41 38 L45 43 L49 35" opacity="0.7" />
    </>
  ),
  // Narrower waist, scooped neck.
  women: (
    <>
      <path d="M32 6 L16 14 L9 29 L19 35 L21 66 L65 66 L67 35 L77 29 L70 14 L54 6 Q43 16 32 6 Z" />
      <path d="M32 6 Q43 16 54 6" opacity="0.55" />
    </>
  ),
  // Same shirt, smaller, with a little collar tab.
  kids: (
    <>
      <path d="M34 14 L21 20 L15 33 L25 38 L25 60 L61 60 L61 38 L71 33 L65 20 L52 14 Q43 23 34 14 Z" />
      <circle cx="43" cy="27" r="3" opacity="0.7" />
    </>
  ),
  // Two shirts, stacked — the pack.
  pack: (
    <>
      <path d="M26 20 L14 26 L8 38 L17 42 L17 62 L53 62 L53 42 L62 38 L56 26 L44 20 Q35 28 26 20 Z" opacity="0.45" />
      <path d="M42 10 L30 16 L24 28 L33 32 L33 52 L69 52 L69 32 L78 28 L72 16 L60 10 Q51 18 42 10 Z" />
    </>
  ),
};

export default function CategoryMark({ slug, size = 44 }) {
  const mark = marks[slug] ?? marks.basic;
  return (
    <svg
      width={size}
      height={size * 0.84}
      viewBox="0 0 86 72"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {mark}
    </svg>
  );
}
