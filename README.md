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
  including the hardware/colour-option and attribute editors.
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

Product photography isn't available yet, so pages use clearly labeled
placeholder image blocks rather than stock or fabricated photos.

## Not yet built

- The visual page-builder / CMS (Section 6) — static pages are still
  hard-coded.
- Telegram integration (Section 8).
- Customer accounts, real search, payments.
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
`ADMIN_PASSWORD_HASH` (bcrypt hash), and `SESSION_SECRET`. `$` characters in
`.env.local` values must be escaped as `\$` — Next.js expands unescaped `$`
as variable references when loading env files.
