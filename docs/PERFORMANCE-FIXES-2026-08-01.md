# Bacoola — Performance fixes applied 2026-08-01

Companion to `PERFORMANCE.md` (2026-07-29), which **diagnosed** the slowness.
This document records what was actually **changed**, what it measured before and
after, what was tried and reverted, and what is still open.

Every number here was measured on 2026-08-01 against the running system. Nothing
is estimated unless it says so.

**Read section 2 first if you are a new session with no context.**

---

## 1. TL;DR

The site went from 3–12 second pages to **under 0.3 seconds**.

| Thing | Before | After |
|---|---|---|
| Homepage | ~3–4 s | 0.14–0.18 s |
| Category page | ~4–6 s | 0.10–0.29 s |
| Product page | 9–12.6 s | 0.20–0.25 s |
| Cart page | 11–20 s | 0.09–0.13 s |
| Checkout page | ~10 s | 0.05–0.09 s |
| Add to cart (backend) | 3.60 s | 0.24 s |
| Apply shipping method | 6.23 s | 0.40 s |
| JS shipped on checkout | 9,288 KB | 824 KB |

**~95% of the win came from one change**: moving the development database off
remote Neon and onto local Postgres. The application-level changes are real but
secondary.

---

## 2. Current state of this machine

A new session needs to know this before doing anything.

### Local database (NEW — this is the big change)

Development now runs against **local PostgreSQL 18**, not Neon.

```
DATABASE_URL=postgresql://postgres:root123@127.0.0.1:5432/bacoola
```

- Set in `apps/backend/.env`. The Neon URL is kept commented directly above it.
- Postgres 18 is installed at `C:\Program Files\PostgreSQL\18`, service
  `postgresql-x64-18`, superuser password `root123`.
- The `bacoola` database is a full `pg_dump`/`pg_restore` copy of Neon, verified
  **row-for-row identical** across all 146 tables (755 products, 8,279 variants,
  38,923 prices, 491 categories, 45 orders).

To refresh the local copy from Neon later:

```bash
pg_dump --dbname="<neon url>" --format=custom --no-owner --no-acl -f neon.dump
pg_restore -h 127.0.0.1 -U postgres -d bacoola --no-owner --no-acl --clean neon.dump
```

**Production is unaffected** — `DATABASE_URL` there comes from the Render
dashboard and still points at Neon.

### What was running when this was written

- Storefront: **production build** (`next start`) on port 8000
- Backend: `medusa develop` on port 9000
- Postgres: local, port 5432

To go back to normal development: `npm run dev` from the repo root. Note that
the production build is a snapshot — code edits do not appear until you rebuild.

---

## 3. Root cause (confirmed by measurement)

`PERFORMANCE.md` called this correctly. Today it was proven numerically.

The Neon database is in `ap-southeast-1` (Singapore). From India:

| Query | Neon (Singapore) | Local Postgres |
|---|---|---|
| `SELECT 1` (zero work) | **71 ms** | **0.10 ms** |
| `SELECT count(*) FROM product` | 73 ms | 4 ms |
| New connection + TLS | 563 ms | 31 ms |

**591x difference per query.**

That would not matter if a request made one query. Medusa makes dozens.
Transaction counts measured via `pg_stat_database` before/after each request:

| Endpoint | DB round trips | Wall time (Neon) |
|---|---|---|
| `/store/regions` | 6 | 0.29 s |
| 12 products, `id,title,handle` only | 17 | 1.36 s |
| 12 products, listing tier | 16 | 1.99 s |
| 1 product, detail tier | 31 | 1.91 s |
| **add to cart** | **65** | **3.55 s** |

Request time tracked **query count**, not payload size — the 12-product query
cost 1.36 s even when asking for three fields and receiving almost nothing.

**The rule this implies: the app server and the database must be in the same
region.** Everything else is detail.

---

## 4. Changes applied

### 4.1 Local development database (the big one)

Described in section 2. Effect, measured on identical requests:

| Backend endpoint | Neon | Local |
|---|---|---|
| `/store/regions` | 0.29 s | 0.008–0.033 s |
| 12 products, listing tier | 1.99 s | 0.10–0.19 s |
| 1 product, detail tier | 1.91 s | 0.07 s |
| Nav categories | 0.52 s | 0.06 s |

Full checkout flow, measured raw against the backend:

| Operation | Neon | Local |
|---|---|---|
| Create cart | 3.11 s | 0.18 s |
| **Add to cart** | 3.60 s | 0.24 s |
| Cart fetch | 0.38 s | 0.03 s |
| Quantity change | 3.20 s | 0.16 s |
| Delivery options | 1.77 s | 0.08 s |
| Set address | 2.82 s | 0.19 s |
| **Apply shipping method** | 6.23 s | 0.40 s |
| Payment collection | 1.10 s | 0.03 s |

### 4.2 Nav shipped 490 categories with full ancestor chains

**Files:** `src/lib/data/categories.ts` (new `CATEGORY_LINK_FIELDS`),
`src/modules/layout/templates/nav/index.tsx`

The nav's category list is passed to three client components (HeaderLinks →
MegaMenu, SideMenu, PromoBanner). Every server→client prop crossing
re-serialises it into the RSC payload, so 490 categories appeared **6,262 times**
per page.

The default field set expands `parent_category` and its parent into full nested
objects. None of those components read them — MegaMenu, SideMenu and PromoBanner
all rebuild the tree from the scalar `parent_category_id`. Now the nav requests
scalars only.

- Backend response: **600 KB → 86 KB**
- `pcat_` occurrences per page: **6,262 → 1,404**
- Homepage HTML: **776 KB → 210 KB**

⚠️ `listCategories` callers that genuinely walk `category_children` — the
category template's descendant-id collection and search — must **not** use
`CATEGORY_LINK_FIELDS`. They were deliberately left on the default shape.

### 4.3 Every image emitted a 17-URL srcset

**File:** `next.config.js` (`deviceSizes`, `imageSizes`)

Next's defaults (8 device + 8 image sizes) made every `fill` image emit 17
candidate URLs, each a long percent-encoded Cloudinary URL — **~3.2 KB of markup
per `<img>` tag**. Thumbnails declare `sizes` topping out at 800 CSS px, so the
2048 and 3840 candidates could never be selected.

Trimmed to `deviceSizes: [640, 828, 1080, 1920]` and `imageSizes: [128, 256, 384]`
— 7 candidates, still covering every breakpoint plus 2x DPR at the largest slot.

### 4.4 Product cards rendered every carousel slide eagerly

**File:** `src/modules/products/components/product-preview/index.tsx`

Each card renders the product's whole image list as carousel slides, and listings
render one card per colourway. A category page emitted **1,266 `<img>` tags for
12 products** — roughly 2 s of server render, almost all of it off-screen.

Now only the visible slide mounts until the card nears the viewport
(`IntersectionObserver`, `rootMargin: 600px`), then the rest mount. Starting
`false` means the **server** also emits one slide per card, which is where the
saving comes from; the first client render matches, so no hydration mismatch.

**Important:** interaction also mounts the slides (`onMouseEnter`,
`onTouchStart`, `onFocusCapture`, and the arrow handlers). This is not
redundant — the category landing grid sits inside a `display: none` container, so
those cards **never intersect**, and the observer alone would leave the arrows
stuck on one image once revealed.

`/categories/men`: **1,266 → 30 `<img>` tags**, 3,375 KB → 1,033 KB,
2.1 s → 0.67 s.

### 4.5 `/store/locales` 404'd on every render

**File:** `src/lib/data/locales.ts`

The endpoint does not exist on this backend. `listLocales` is designed to return
`null` for that, but Next's Data Cache only stores **successful** responses, so
`cache: "force-cache"` did nothing — the nav renders on every page, so every page
view re-requested a known-missing route (~75 ms each).

Added an in-process cache of the outcome (successes included) with a 300 s TTL
and in-flight sharing. Adding the route to the backend later is still picked up
without a restart.

### 4.6 `getCategoryByHandle` fetched twice per category page

**File:** `src/lib/data/categories.ts`

Category pages are `force-dynamic`, which defaults their fetches to `no-store`.
`generateMetadata` and the page body each resolve this call, and React's `cache()`
does not dedupe across those two render passes — so the same request was issued
twice and cached neither time (65 ms each).

Added `revalidate: 300`, matching the nav list. Both calls are now cache hits at
2 ms. Tag invalidation still busts it immediately on an admin edit.

### 4.7 Checkout shipped 9.3 MB of JavaScript

**Files:** new `src/app/api/locations/route.ts`, new
`src/modules/checkout/hooks/use-address-locations.ts`, plus
`src/modules/checkout/components/shipping-address/index.tsx` and
`.../billing_address/index.tsx`

Both address forms did `import { State, City } from "country-state-city"`. That
package bundles a **7.7 MB `city.json` (every city on earth)** plus a 0.5 MB
`state.json`. Because the forms are client components, the whole dataset shipped
to the browser — to populate two dropdowns, for a store that serves India.

The lookup now lives in a route handler; the client fetches only the names it
displays.

```
GET /api/locations?country=IN          -> 36 states,  1.4 KB, 13 ms
GET /api/locations?country=IN&state=MH -> 574 cities, 11 KB, 121 ms
```

Cached `public, max-age=86400`. The hook caches per country/state across both
forms, de-dupes in-flight requests, and degrades to empty lists on failure so a
failed lookup can never block checkout.

| | Before | After |
|---|---|---|
| Checkout route JS | 2.33 MB | 62.8 kB |
| Checkout First Load JS | 2.49 MB | 225 kB |
| Raw JS served on checkout | 9,288 KB | 824 KB |

Verified in build output: the dataset is absent from every client chunk and
present only in the server bundle.

---

## 5. Tried and reverted — do not repeat

**Shrinking the recommended-products pool from `limit * 4` to `limit * 2`.**

It looked obviously right — the product page fetched 40 products at listing tier
(1.39 MB, 3.2 s) to render a strip of 8 cards. Halving the pool **made the page
bigger and slower**: 1.36 MB → 2.23 MB, 0.6 s → 1.0 s.

Why: only `limit` products are ever serialised, so pool size does not land in the
HTML. What it changes is *which* products win the price-closeness ranking. The
narrower pool was forced to settle for worse price matches, which happened to be
image-heavy multi-colourway products — 124 distinct images instead of 80.

The pool size in `getRecommendedProducts` is back to `Math.max(limit * 4, 24)`,
with a comment recording this. Leave it alone.

---

## 6. Not verified — needs a human

Two things could not be confirmed in this session and should be checked in a real
browser:

1. **Carousel slides mounting on scroll/hover.** The server-side saving is
   proven (30 `<img>` tags instead of 1,266). The client-side mounting could not
   be exercised because the automation browser did not composite frames, so
   nothing laid out and `IntersectionObserver` never fired. **Open a category
   page, hover a product card, click the arrows — images should cycle.** If they
   do not, revert `product-preview/index.tsx`.

2. **Checkout state/city dropdowns.** The API and wiring are verified, but the
   address form sits behind the sign-in gate and could not be reached. **Log in,
   go to checkout, pick a state — cities should load a moment later.**

---

## 7. Deployment — the region problem

`PERFORMANCE.md` §6 and the discussion on 2026-08-01 both land here. Measured
network latency **from India**:

| Region | Latency |
|---|---|
| Oregon (us-west-2) | **294 ms** |
| Singapore (ap-southeast-1) | **80 ms** |
| Mumbai (ap-south-1) | 18 ms |

The production chain is:

```
Customer (India) → Vercel (storefront) → Render (backend) → Neon (database)
                                              ↓
                                       Upstash (Redis)
```

**Every hop must be in the same region, and that region should be Singapore** —
Neon is already there, and it is 3.7x closer to Indian customers than Oregon.

| Service | Currently | Should be |
|---|---|---|
| Vercel (storefront) | Washington DC (default) | **Singapore (sin1)** |
| Render (backend) | Oregon | **Singapore** |
| Neon (database) | Singapore ✅ | leave alone |
| Upstash (Redis) | US West ⚠️ | **Singapore** |

**Do not migrate Neon to Oregon.** That was considered and is the wrong
direction — it would fix the app↔DB gap but add ~294 ms to every Indian
customer's page.

Moving only Render would open a new gap: the storefront makes ~7 backend calls
per page, so Vercel-in-US → Render-in-Singapore costs ~1.6 s per page.

### Switching regions safely

Render cannot change a service's region, so a new service is required. **No data
migration is needed** — old and new backends point at the same Neon database, so
they can run in parallel and be switched over with no downtime.

1. Copy the existing Render **Build Command**, **Start Command** and the entire
   **Environment** tab first. They live only in the dashboard, not in the repo.
   See `DEPLOYMENT.md` §2 for the exact commands — every part is load-bearing.
2. Create the new Upstash Redis in Singapore (URL must be `rediss://`).
3. Create the new Render service in Singapore, same commands, same env vars, new
   Redis URL, `NODE_VERSION=20`.
4. Deploy, note the new URL.
5. Update: `STORE_CORS`/`ADMIN_CORS`/`AUTH_CORS` on the backend; Vercel's
   `NEXT_PUBLIC_MEDUSA_BACKEND_URL`; Vercel function region → `sin1`; the
   Razorpay webhook URL; any Shiprocket webhook.
6. Redeploy the storefront on Vercel.
7. Test browse → cart → checkout → place order → confirm it reaches Shiprocket.
8. **Only then** delete the old Render service.

⚠️ The Neon database is shared with another developer (`DEPLOYMENT.md` §2). Tell
them before switching.

---

## 8. Still open

- **Render and Neon are both on free plans that sleep when idle.** Render's spins
  down after inactivity and takes 50+ seconds to wake; Neon suspends after ~5
  minutes. This is separate from the region problem and moving regions will not
  fix it. For a live store both need paid plans, or the first customer of each
  quiet period waits a minute. This was part of the original ">50 second" report.
- **Four routes are `force-dynamic`** (category, collection, product, search), so
  they get no full-route cache. Each only does it to read `searchParams`; moving
  that read into a client component or Suspense boundary would let the routes
  cache. Not attempted — see `PERFORMANCE.md` and `DEPLOYMENT.md` §5 for why the
  flag was added (it fixed production 500s).
- **`experimental.serverMinification: false`** in `next.config.js` leaves server
  bundles unminified. Not investigated; production render is already 20–80 ms.
- **Category pages fetch the full category list twice** — the nav (`limit: 1000`,
  now lean) and the category template (`limit: 500`, still the nested shape for
  `collectIds`). The second one is a server-only fetch that is not serialised, so
  it costs a request but not payload.

---

## 9. Files changed on 2026-08-01

```
apps/backend/.env                                              DATABASE_URL -> local (gitignored)
apps/storefront/next.config.js                                 deviceSizes / imageSizes
apps/storefront/src/lib/data/categories.ts                     CATEGORY_LINK_FIELDS + revalidate
apps/storefront/src/lib/data/locales.ts                        negative cache for the 404
apps/storefront/src/lib/data/products.ts                       comment only (see section 5)
apps/storefront/src/modules/layout/templates/nav/index.tsx     use lean category fields
apps/storefront/src/modules/products/components/product-preview/index.tsx
                                                               deferred carousel slides
apps/storefront/src/modules/checkout/components/shipping-address/index.tsx
apps/storefront/src/modules/checkout/components/billing_address/index.tsx
                                                               use the locations hook
apps/storefront/src/app/api/locations/route.ts                 NEW - server-side state/city lookup
apps/storefront/src/modules/checkout/hooks/use-address-locations.ts
                                                               NEW - client hook
docs/PERFORMANCE-FIXES-2026-08-01.md                           NEW - this file
```

The working tree contained a large amount of unrelated uncommitted work before
this session. The list above is only what changed on 2026-08-01.
