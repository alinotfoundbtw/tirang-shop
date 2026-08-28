# The kit as a module — additive only

The kit does not get merged into the shop's files. It lives in its own folder,
and the shop imports it. Two reasons: the working code stays working, and the
same folder copies unchanged into your next project.

```
src/kit/
├── kit.css        the kit's own variables, scrollbar, error-page styling
├── Mark.jsx       the logo / mark
├── Loader.jsx     the loading animation
├── ErrorArt.jsx   the 404 and 500 artwork
├── IntroCard.jsx  the introduction card
├── eggs.js        every easter egg, plus initEggs()
└── README.md      what this is and how to drop it into another project
```

Nothing outside `src/kit/` is rewritten. Not `app.css`, not `tokens.css`, not
`States.jsx`'s logic, not a single existing component's behaviour.

## Namespacing, so nothing can collide

Kit CSS variables are prefixed `--k-`. Kit classes are prefixed `.kit-`. The kit
may read shop tokens (`var(--paper)`) so it inherits a re-skin; the shop never
reads kit variables. One direction only.

`kit.css` is wrapped in `@layer kit` and imported after `app.css`, so kit rules
win where they overlap — the scrollbar in particular — without `!important` and
without touching the original block. The old rule stays where it is and simply
loses.

## The touchpoints

Zero edits to existing files is not achievable: something has to import the kit.
Four lines is the floor, and each one is revertible by deleting it.

| File | The one change |
|---|---|
| `src/main.jsx` | `import './kit/kit.css'` after `app.css`, and `initEggs()` guarded by `import.meta.env.PROD` |
| `src/components/States.jsx` | inside `Loader`, `ErrorState` and `EmptyState`, swap only the inline `<svg>` for `<KitLoader />` / `<ErrorArt />` |
| `src/pages/Static.jsx` | inside `NotFound`, swap only the inline `<svg>` for `<ErrorArt variant="404" />` |
| wherever the intro card belongs | one `<IntroCard />` element |

In `States.jsx` and `Static.jsx`, the surrounding markup, the Persian copy, the
class names and the props all stay exactly as they are. You are replacing an
`<svg>` element with a component that renders an `<svg>`. Nothing else in those
files is yours to touch.

## The copy stays Persian

The kit supplies styling and signature, never words. «این صفحه دوخته نشده»,
«این یکی بالا نیامد», «در حال آماده‌سازی…» — these are the shop's voice and they
do not change. `ErrorArt` and `KitLoader` render artwork only; the text around
them is passed in or already sits in the existing component.

The exceptions are the console easter egg and the footer mark, which are yours
and can be in English.

## If something genuinely needs an existing file changed

Stop and ask, with the specific file, the specific lines, and why the additive
route does not work. Do not decide it is easier to just edit the old file.
