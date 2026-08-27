# تیرنگ — Persian t-shirt shop template

A phone-first storefront with real product photography, an owner panel, and a
retrieval assistant that answers only from the shop's own stock. Built to be
re-skinned for a new client in an afternoon.

```bash
npm install
npm run dev                                  # storefront on :5173
ANTHROPIC_API_KEY=sk-... npm run api         # assistant on :8787 (optional)
```

Without the API key the assistant still answers — it falls back to the local
answer builder in `src/lib/rag.js`. The demo never dead-ends.

Routes: `/` `/products` `/p/:slug` `/cart` `/wishlist` `/ask` `/faq` and
`/admin` (خلاصهٔ فروش، محصولات، سفارش‌ها، ظاهر فروشگاه).

---

## What's worth showing a client

- **Colour swatches swap the photo, everywhere.** Each colourway carries its own
  photo set, so tapping «زیتونی» on a grid card or the product page shows the
  actual olive shirt — not a CSS tint over one image. The next colourway is
  preloaded on hover, so the swap is instant.
- **Zoom that matches the input device.** On a mouse, hovering the main image
  scales it and tracks the pointer — a magnifier with no second request. On
  touch, tapping opens a full-screen lightbox with pinch, double-tap, drag-pan
  and swipe between shots.
- **Stock is per colour *and* per size.** A size that's gone in black but there
  in white is drawn struck through, and switching colour keeps your size if that
  colour has it. «فقط ۲ عدد مانده» appears only when it's true.
- **سایزم را پیدا کن** — height and weight in, a size and the reason out. It
  accounts for fit: a size down for oversized, a size up for slim. It suggests;
  it never silently picks.
- **Quick view** from the grid: choose colour and size and add to cart without
  losing your scroll position.
- Wishlist, recently viewed, free-shipping progress bar, sticky mobile buy bar
  that appears only after the real button scrolls away.

## Re-skinning for a new client

1. **Colours and fonts** — open `/admin/brand`, pick a preset or drag the
   pickers. The storefront updates live. Copy the generated block into
   `src/styles/tokens.css` to make it permanent. Six values and two font
   families are the entire visual surface; no component hard-codes a colour.
2. **Catalog** — replace `src/data/products.js`. The shape is the contract:
   `bio`, `tags`, `fit`, `fabric` and the per-colour `stock` map feed the
   storefront, the SEO layer and the retrieval index at once.
3. **Copy** — shop name lives in `index.html`, `src/lib/seo.js` and
   `src/components/Layout.jsx`.
4. **Photos** — every colourway's `photos` array takes any URL. The demo points
   at Pexels; swap in the client's own CDN.

## Photos

Demo images come from Pexels (free to use, no attribution required) and are
hotlinked from `images.pexels.com`. Fine for a portfolio demo. For a shop that
goes live, download them or shoot real product photos and serve them from your
own CDN — hotlinking someone else's bandwidth is not a production plan. If an
image ever fails, `Photo` shows the colourway's tone plus a plain message rather
than a broken-image icon.

## Fonts

Morabba (display) + Estedad (body), Vazirmatn as fallback, loaded from jsDelivr.
CDN paths for Persian fonts move around — for production, put the woff2 files in
`public/fonts/` and declare them with `@font-face`. If a heading renders in
Vazirmatn, that's the CDN path, not the CSS.

## The assistant

`src/lib/rag.js` — no vector database and no embeddings. A catalog of a few
hundred items fits in memory and answers in under a millisecond, and the shop
owner can read the code.

- Persian text is normalised first: Arabic ي/ك → Persian ی/ک, ZWNJ split,
  Persian and Arabic digits → Latin, plus possessive endings, so «رنگش» reaches
  «رنگ». Without this, half of all real queries miss.
- A synonym map bridges how people type and how the catalog is written:
  «گشاد» → «اورسایز», «زنونه» → «زنانه», «ارزون» → «ارزان».
- BM25 over weighted fields — name ×3.2, tags ×2.6, category ×2.2, colours ×2.
- The query is read for budget («زیر ۳۰۰ تومن», «بین ۲۰۰ تا ۵۰۰ هزار»), for a
  named size, and for a height it can convert to a size. Items with nothing left
  in that size are pushed down: there's no point recommending a size they can't
  buy. The budget parser walks whole tokens, because a substring scan finds
  «ده» inside «چنده» and caps the question at ten thousand toman.
- Policy questions (sizing, exchange, shipping, shrinkage) route to the FAQ,
  scored with IDF so a rare word like «تعویض» decides the match and a common one
  like «سایز» doesn't.

`server/index.mjs` holds the API key and the system prompt, so a visitor can
neither read the key nor rewrite the shop's instructions. It sends only the rows
retrieval already picked, including per-size stock, and instructs the model to
refuse anything not in them — no invented prices, sizes, or delivery promises.
Rate limit: 20 questions per IP per 5 minutes.

The panel's **«چیزهایی که مشتری خواست و نداشتیم»** table is built from questions
the assistant couldn't answer, and **«سایزی که برمی‌گردد»** shows return rate per
size. Those two screens are what a shop owner can act on tomorrow morning.

## SEO

`src/lib/seo.js` sets title, description, canonical, OG, robots and JSON-LD per
route: Product (with images, colours, sizes, availability) + Breadcrumb on
product pages, FAQPage on `/faq`, Store + SearchAction in `index.html`. `/cart`,
`/wishlist`, `/admin` and search-result pages are `noindex`.

This is a client-rendered SPA — Google executes JS, most social scrapers don't.
For a client who needs guaranteed crawlability, port to Next.js: `useSeo`
becomes `generateMetadata()` and the component tree stays as-is.

## Notes

- Accessibility: skip link, visible focus rings, labelled swatches and icon
  buttons, live regions on toasts and the assistant, keyboard control in the
  gallery and lightbox, `prefers-reduced-motion` respected.
- The admin panel is UI only — no auth, no backend. Put it behind a real login
  before this ships for a real shop.
- Cart, wishlist and recently-viewed live in `localStorage` under `tirang.*`.
