---
description: Apply the identity kit additively, without touching working files
---

Apply the identity kit.

Read `docs/kit-module.md` and `docs/brand.md` first.

If either `>>> PASTE <<<` block in `docs/brand.md` is empty, stop here and tell
me which one. Do not design a placeholder mark, loader or error illustration.
Something that looks finished never gets replaced.

Then:

1. Build `src/kit/` — `kit.css`, `Mark.jsx`, `Loader.jsx`, `ErrorArt.jsx`,
   `IntroCard.jsx`, `eggs.js`, `README.md`. Kit variables prefixed `--k-`,
   classes prefixed `.kit-`, CSS wrapped in `@layer kit`.
2. List the four touchpoints and the exact line you intend to add or swap in
   each. Wait for my go-ahead.
3. Make those four changes and nothing else.

Constraints:

- Every Persian string in the existing components stays byte-identical. You are
  swapping `<svg>` elements, not rewriting components.
- The kit reads shop tokens so it follows a re-skin. The shop never reads kit
  variables.
- The console egg is guarded by `import.meta.env.PROD`.
- Every animation you add falls under the existing `prefers-reduced-motion` rule.

Finish with `git diff --stat` and `npm run build`. If the diff touches any file
outside `src/kit/` beyond the four agreed lines, say so plainly rather than
letting me find it.
