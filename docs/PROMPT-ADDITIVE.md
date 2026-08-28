# Kickoff prompt — additive

Use this instead of `PROMPT.md`. Same work, with a hard constraint on how.

---

You are working on Tirang, a Persian t-shirt e-commerce template. Read
`CLAUDE.md` for the standing rules, then `docs/kit-module.md`.

**The standing constraint for everything below: add files, do not rewrite them.**

The storefront works today — catalog, product pages with colourway
photo-swapping and zoom, per-colour-per-size stock, quick view, wishlist, cart,
a local retrieval assistant, an admin panel, per-route SEO. All of it stays as
it is. New capability arrives as new files that existing files import.

When a task seems to require editing something that already works, stop and ask
me first, naming the file, the lines, and why the additive route fails. "It was
simpler this way" is not a reason I will accept, because simpler for you means a
regression I have to find later in a repo I already tested.

Before each step, tell me which existing files you will touch and how many lines
in each. Then wait. After each step, run `npm run build` and show me the diff
stat, not a summary of it.

## 1. The kit

`docs/brand.md` has two blocks marked `>>> PASTE <<<`. If either is empty, stop
and tell me which one before doing anything else. Do not design a substitute.

Build `src/kit/` exactly as `docs/kit-module.md` describes, then wire the four
touchpoints. Four lines, four files, nothing else.

## 2. Self-host the photos

New script at `scripts/fetch-photos.mjs`. It reads the URLs in
`src/data/products.js`, downloads each, writes 1200px and 600px WebP into
`public/img/<slug>/<colour>-<n>.webp`, and emits a **new** file,
`src/data/products.local.js`, with local paths and `srcset`.

It does not overwrite `src/data/products.js`. Switching between the two is one
import line, which means I can compare them and revert in a second. Report page
weight before and after.

## 3. Backend

Read `docs/backend-and-launch.md`. Everything new lives under `server/` and
`src/api/`. The storefront's data shape is the contract: write an adapter that
maps the backend's response into the shape in `docs/data-model.md`.

The components keep consuming the same shape they consume now. If a component
needs changing to accept API data, the adapter is wrong.

Scope: products, variants with per-size stock, orders, customers. No payment, no
SMS yet.

## 4. Auth

Admin login for `/admin`, customer accounts via one-time SMS code. New route
guard as a wrapper component, not edits scattered through the admin screens.
`docs/backend-and-launch.md` covers the service-line and template lead times
that will otherwise cost a week.

## 5. Payment

Zarinpal, behind an adapter so a second gateway is a new file. Verify
server-side and make the callback idempotent: a double callback must not create
two orders or decrement stock twice.

---

If a decision needs information you do not have — a price, a fabric detail, a
brand asset, a business rule — ask. Do not pick something plausible and move on.
