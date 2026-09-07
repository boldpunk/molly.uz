# Molly Home — storefront

Phase 1 MVP storefront for [molly.uz](https://molly.uz), built per the Molly
Home Technical Specification (Route B: custom headless stack, Next.js
front-end).

## What's here

- Home, catalog (with category-aware filters), product detail pages
  (made-to-order configurator and price-on-request patterns), and the
  quote/measurement request flow — spec Sections 5.1–5.4.
- Local seed data matching the Section 10 data model: 5 kitchen models
  (ANTRO/SELEN/FIONA/TERRA/KASELLA) with real per-metre pricing, the SAVAGE
  collection (wardrobe/bedroom/beds) as price-on-request, and an honest
  empty state for Мягкая мебель (no fabricated products).
- Cyrillic-first typography (Golos Text / Inter) and the brand palette
  (navy `#182B4C`, cream `#FAE8D8`, sage accent) per Section 11.3.
- Mobile-first layouts, including the accordion filter panel and the
  reordered product page (price/CTA before description) called for in
  Section 9.1.

Product photography isn't available yet, so pages use clearly labeled
placeholder image blocks rather than stock or fabricated photos.

## Not yet built

Out of scope for this slice (see the spec for what's next):

- The visual page-builder / CMS (Section 6) — content here is hard-coded.
- The Mebelflow back office (Section 7).
- Telegram integration (Section 8).
- Accounts, real search, payments.

The quote request form currently clears the request list and shows a
confirmation on submit; it isn't wired to a backend yet.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```
