# Molly Home — storefront + admin back office

Phase 1 MVP for [molly.uz](https://molly.uz), built per the Molly Home
Technical Specification (Route B: custom headless stack, Next.js + Postgres
on Neon).

## What's here

**Storefront** (Sections 5.1–5.4): home, catalog (category-aware filters),
product detail pages (made-to-order configurator and price-on-request
patterns), and the quote/measurement request flow — now backed by the real
database, including a working submission that persists to `requests`.

**Admin back office** (Section 7), at `/admin`:

- Password-gated admin area (`/admin/login`) — a signed, httpOnly session
  cookie, bcrypt-hashed password (`ADMIN_PASSWORD_HASH` env var), enforced
  by `src/proxy.ts`.
- Category and product CRUD (`/admin/categories`, `/admin/products`),
  including the hardware/colour-option and attribute editors, and a photo
  uploader per product (Vercel Blob storage) that replaces the placeholder
  image on the storefront as soon as one is uploaded.
- Order/lead pipeline (`/admin/requests`): the New → Contacted → Measured →
  In production → Ready/Delivered stages from Section 7.2, with a status
  history log and notes/assigned-manager fields.
- A basic dashboard (`/admin`, Section 7.5): counts by status/category, top
  products by request volume, and a revenue view built from real submitted
  estimates.

Both the storefront and the admin area read/write the same Postgres
database (Drizzle ORM, `@neondatabase/serverless`) — there's no separate
mock data layer anymore.

Other details:

- Cyrillic-first typography (Golos Text / Inter) and the brand palette
  (navy `#182B4C`, white background, sage accent used only for badges) per
  Sections 9.3 and 11.3.
- Mobile-first layouts, including the accordion filter panel and the
  reordered product page (price/CTA before description) called for in
  Section 9.1.

Product photos can be uploaded per product from `/admin/products`; until
one is uploaded, pages fall back to a clearly labeled placeholder block
rather than a stock or fabricated photo.

Customer accounts (`/account`) — phone/password registration and login,
with a request history scoped to the logged-in customer; the request form
still supports anonymous/guest submission.

Catalog search (`/search`) — matches product name, spec line, description,
collection, and category name.

## Not yet built

- The visual page-builder / CMS (Section 6) for static pages — content is
  still hard-coded; only product photos are editable from the admin so far.
- Telegram integration (Section 8).
- Payments.
- Role-based permissions (Section 7.6) — the admin area currently has a
  single Administrator-level login, not the full role model from Section 3.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run build

npm run db:push     # push the Drizzle schema to the database
npm run db:seed     # (re)seed categories/products from src/db/seed-data.ts
```

Requires `.env.local` with `DATABASE_URL` / `DATABASE_URL_UNPOOLED` (Neon),
`ADMIN_PASSWORD_HASH` (bcrypt hash), `SESSION_SECRET`, and
`BLOB_READ_WRITE_TOKEN` (Vercel Blob, for product photo uploads). `$`
characters in `.env.local` values must be escaped as `\$` — Next.js expands
unescaped `$` as variable references when loading env files. Running
`vercel env pull` / `vercel blob create-store` rewrites the whole file and
will silently reintroduce this bug — re-check `ADMIN_PASSWORD_HASH` after.
