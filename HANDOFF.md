# Bacoola — Session Handoff

Context for whoever picks this up next. Written 2026-07-17.

Everything below was verified against the running system unless explicitly
marked as unverified. Where something is a guess, it says so.

---

## 1. Repo state

- **Branch: `merge-branch`**, 8 commits ahead of `origin/merge-branch`. **Nothing is pushed.**
- **`main` is untouched** (local `main` sits at the same commit as the branch's base + the user's own commit `9159cef`).
- Untracked and deliberately not committed: `.claude/` (local editor config), `backups/`.

Unpushed commits (oldest → newest):

```
7cdaaea feat: pull landing pages CMS, footer, and account UI from friend's repo
095792a feat: wire landing pages CMS into storefront category template
1d0b614 fix(admin): resolve landing pages CMS backend URL relatively
4b11ab2 fix(catalog): backfill missing variant prices and stop seeds failing silently
3ff1fd2 fix(shiprocket): backfill variant dimensions and surface auto-fulfil failures
47118b0 feat(admin): refuse to publish products whose variants lack dimensions
3a023b8 fix: block publishing unpriced products and stop the add button hanging
988411e feat(sale): enable category sale pricing for women, teen and kids
```

The plan the user described: pull their friend's work into `merge-branch`, merge
both feature sets, verify, **then** push to `main`. Do not push to `main` without
asking — the user has been asked twice and chose to hold both times.

### The friend's repo

`https://github.com/Jivesh-lab/Ecommerce_Platform.git`, added as remote `friend`.
Shared ancestor is `966fd3a`. Their `main` is `61430f4`.

Three features were selectively pulled (their commits interleave unrelated work,
so cherry-picking commits was not viable — files were taken individually):

1. **Landing pages CMS** (admin at `/app/content/landing-pages`) — backend module,
   admin routes, API routes, plus the storefront rendering.
2. **Footer** — taken whole.
3. **Account/login UI** — taken whole; byte-identical to theirs.

**Deliberate deviations from their code (do not "fix" these):**

- `apps/backend/medusa-config.ts` — only their landing-pages module block was
  taken. Their version added `SHIPROCKET_EMAIL || "dummy@example.com"` and
  `channel_id: "12345"` fallbacks, which would turn a misconfigured Shiprocket
  integration into a silent failure. **The user's Shiprocket config wins.**
- `categories/templates/index.tsx` — hand-merged. Their CMS fetch lives in the
  editorial branch; the user's descendant-category-id collection
  (`allCategoryIds`) lives in the PLP fallback branch. Both are needed.
- `header-links/index.tsx` — the user's version kept. Their only change was a
  "Home" nav link the user already had.
- `CategoryProductListing.tsx` — the user's grid spacing kept.

**Standing rule from the user: on any conflict, their code wins.**

---

## 2. Environment — read this before touching anything

### The database is SHARED and is not local

`DATABASE_URL` points at **Neon cloud Postgres**
(`ep-wandering-grass-aonp776h...aws.neon.tech/neondb`). The friend uses the same
database — his landing-pages migrations were already applied and his CMS content
was already in it. **Any destructive DB action hits his environment too.** Ask first.

Raw SQL against it is fast (416 rows touched in 0.07s). Slowness is always
Medusa's ORM, never the DB.

### Do not run `medusa build` or `next build` while dev servers are running

Both clobber the directory the running dev server uses and **kill it**. This was
done twice in this session (killed the backend once, the storefront once). If a
page suddenly 500s with `ECONNREFUSED`, this is why. Restart via
`.claude/launch.json` configs (`backend` → 9000, `storefront` → 8000).

### Admin credentials

Admin user is `admin@bacoola.com`. **The password is not known** and must not be
reset. Only publishable (storefront) API keys exist — no admin secret key. This
means admin-authenticated HTTP cannot be tested directly; middleware logic was
verified by driving handlers against the real container instead.

### Backups

`backups/products-backup-2026-07-17T05-35-51-664Z.json` — all 818 products with
variants, prices and dimensions. Taken before any destructive work.

---

## 3. What was fixed this session (all verified)

### Prices — 800 variants had none

**Cause:** `seed-mock-products.ts` creates products in batches of 50 wrapped in a
`try/catch` that logged and continued. One batch failed *after* creating products,
variants, dimensions and inventory but *before* prices — exactly 50 products — and
the seed still reported success.

**Fixed by** `src/scripts/fix-missing-prices.ts` (idempotent).

**Non-obvious:** `updateProductVariantsWorkflow` **cannot** be used to add a price
to a variant that has none — it only updates an existing price set and rejects
with *"do not have prices associated"*. The script instead does what
`createProductVariantsWorkflow` does internally: `pricing.createPriceSets()` then
`remoteLink.create()` linking `Modules.PRODUCT.variant_id` ↔ `Modules.PRICING.price_set_id`.

Verified: 0 unpriced variants; the variant that previously 400'd now adds to cart.

### Dimensions / Shiprocket

5 variants (all hand-made products) had no weight or dimensions. Backfilled via
the pre-existing `src/scripts/fix-variant-dimensions.ts`. Now 0 published
variants are missing dimensions.

`src/subscribers/auto-fulfill-order.ts` used to swallow every failure into a log,
so a paid-but-unshippable order looked healthy. It now writes the reason to
`order.metadata.auto_fulfill_error` and clears it on a later success.

**Non-obvious:** `updateOrders` **merges** metadata and **cannot delete a key**.
An earlier draft used `delete metadata.x`, which silently did nothing — a fixed
order would have looked broken forever. Clearing writes an explicit `null`.

The subscriber deliberately does **not** throw: it would retry against the same
bad data and take down the event bus worker.

### Publish guard — `apps/backend/src/api/middlewares.ts` (new)

Blocks **publishing** (not saving) a product when any variant lacks a price or
any of weight/length/width/height, and blocks publishing with zero variants.
Guards product create/update **and** variant create/update (a variant added to an
already-published product never touches the product's status).

Gating publish rather than save is deliberate: the admin saves the product first
and its variants in a separate request, so blocking incomplete saves would break
the add-product flow. **Drafts stay freely editable.** The user confirmed the
guard fires against the real admin.

Treats `0` as missing, not just `null`. Merges partial update bodies over stored
values. Falls through on unexpected errors — a guard that breaks the admin is
worse than one that misses an edge case.

### Storefront — priceless products

Was: a pulsing skeleton where the price goes (reads as "loading", never resolves)
and an Add button that hung on "Loading..." forever because `handleAddToCart` had
no try/catch, so `setIsAdding(false)` never ran after the server rejected it.

Now: "Price unavailable", a disabled "Unavailable" button, a plain explanation,
and errors surfaced. Also fixed the button reading "Out of stock" when no variant
was picked — the old check was `!selectedVariant && !options`, and `options` is an
object, so that branch could never be true. It reads "Select options" now.

### Build

`medusa build` now exits 0. It had been failing on two pre-existing type errors:
`seed-mock-products.ts` pushing into an inferred `never[]`, and `fix-categories.ts`
passing a string where `deleteProductCategories` wants `string[]`.

### Landing pages CMS config

`baseUrl` was hardcoded to `http://localhost:9000` in two duplicate config files.
That code runs in the **browser**, so deployed it would point at the admin user's
own machine. Now `import.meta.env.VITE_BACKEND_URL || "/"`.

**Non-obvious:** the duplicate `src/lib/config.ts` was deleted and its two
importers repointed at `src/admin/lib/config.ts`. `src/lib` is compiled to
**CommonJS as server code** and rejects `import.meta` (TS1470); `src/admin` is
handled by Vite and does not. The duplicate was admin browser code sitting in the
server tree. **Do not re-add it.**

---

## 4. OPEN — the immediate task

### Sale categories: overlapping products (needs a user decision)

Category-driven sale pricing works via `metadata.sale_percent` on a product
category. Core logic: `apps/backend/src/lib/sale-prices.ts`. It was **already
category-agnostic** — it walks every category and acts on whichever carry
`sale_percent`. Men "worked" only because it was the one category with the value.

`src/scripts/seed-sale-percents.ts` (new) seeded all nine sale sections, reading
the starting percent from each category's own name ("Sale 40% off" → 40). It is
non-destructive: a category that already has a percent is left alone (men is on
45 despite being named 40).

**The live problem:** the user put the same 8 products in **two** sale categories:

```
Black Suit           -> teen-girl-sale-70(70%), women-sale-40-v2(40%)
red suit             -> teen-girl-sale-70(70%), women-sale-40-v2(40%)
Bacoola Piqué Polo   -> teen-girl-sale-70(70%), women-sale-40-v2(40%)
Bacoola Women's Polo -> men-sale-40-v2(45%), teen-girl-sale-70(70%), women-sale-40-v2(40%)
(+ 4 more)
```

Medusa serves the **cheapest** applicable price, so 70% beats 40% and the women's
sale page shows 70% off. This is correct Medusa behaviour, not a bug.

**The constraint that matters:** a variant has **one** price, globally — not one
per category page. "40% on the women page and 70% on the teen page for the same
product" is **impossible** with price lists. Each product must belong to **one**
sale section.

**Next step:** the user was asked which products belong in which section and has
not yet answered. Once they say, remove the overlap and re-run
`npx medusa exec ./src/scripts/sync-sale-prices.ts`.

---

## 5. Known gotchas (hard-won — do not rediscover these)

### Dimensions must be on the VARIANT

Medusa's fulfillment workflow loads `items.variant.product` but **only** these
fields: `hs_code`, `id`, `material`, `mid_code`, `origin_country` — **not** weight
or dimensions. So the Shiprocket plugin's product-level fallback
(`variant?.weight || product?.weight`) can never fire.

**The plugin's own error message is wrong.** It says *"Please set them on the
Variant or Product."* Setting them on the Product does nothing.

### Only 4 variant fields can block Shiprocket

`weight`, `length`, `width`, `height`. Everything else either has a fallback or is
never sent:

- SKU → falls back `variant.sku → variant_sku → item.sku → item.id`
- HS code → falls back to `0`
- EAN, UPC, barcode, MID code, **country of origin**, material → **never sent**

`billing_country`/`shipping_country` are required but fall back to `"IN"`, and are
address fields, not variant fields.

### Sale price sync takes ~35-48s — this is NOT a caching bug

Measured breakdown for one category (416 prices, 14 products):

| step | time |
|---|---|
| expand products + prices | 1.1s |
| create the price list | 2.1s |
| **delete the old price list** | **~42s** |
| raw SQL touching the same rows | 0.07s |

The storefront already fetches with `cache: "no-store"` — it shows the truth; the
backend simply has not finished. The cost is Medusa's per-row cascade on
`deletePriceListsWorkflow`. **`pricing.softDeletePriceLists` was tried and is
slower (~48s)** — it was reverted. Do not retry that.

If the user wants this faster, the options discussed were:
1. Create-before-delete — discount *increases* would show in ~2s; *decreases*
   would still take ~40s (cheapest wins while both lists exist).
2. Accept ~40s as a background job.
3. Bypass the ORM with raw SQL for deletion — fast but unsupported; needs testing.

### Adding products from the CATEGORY page does not sync

`batchLinkProductsToCategoryWorkflow` has no `emitEventStep`, so **no event fires**
and the subscriber never runs — the discount silently never appears. This bit the
user directly this session.

Workarounds: assign categories from the **product page** (fires `product.updated`),
or run `sync-sale-prices.ts` manually. A scheduled re-sync job was offered but not
built.

### Sale price list ownership

Generated lists carry `metadata.managed_by = "auto-sale"` + `category_id`. The
sync **only** touches marked lists, so hand-made admin price lists coexist
untouched. This was an explicit user requirement. Never hand-edit a generated list.

### Category names bake in the percent

"Sale 40% off" while `sale_percent` is 45 — the name lies. Not yet fixed; would
touch `seed-categories.ts` and the nav.

### Duplicate products with the same title exist

There are products sharing a title with different handles (e.g.
`tg-sale-see-all-essential-1` vs `tb-sale-see-all-essential-1`). Querying by
title alone will give misleading results — **query by handle or id.** This caused
a wrong conclusion earlier in the session.

### `SHIPROCKET_SKIP_AWB="true"` is currently ON

The wallet is unfunded. Orders appear under Shiprocket "New Orders" with no
tracking number. This is expected, not a failure. Order creation is free; AWB
assignment needs a funded wallet.

---

## 6. Also open / not done

- **Place order button** — still does not say *why* it is disabled. `notReady` in
  `payment-button/index.tsx:26` is true if any of `shipping_address`,
  `billing_address`, `email`, or `shipping_methods` is missing. The user only ever
  sees a dead button. Suggested fix: list what is missing under the button.
  UI-only, no logic change.
- **`fix-categories.ts`** — has a `catch { // ignore }` that swallows errors, and
  the script **deletes categories**. Only its type error was fixed; it was not run.
- The zero-variant publish hole is now closed, but note the admin's create-product
  wizard forces a variant step anyway, so it was only reachable via direct API.

---

## 7. Working style the user expects

- **Verify, do not assume.** Several confident-sounding conclusions this session
  were wrong until measured: the `softDeletePriceLists` "optimisation" (slower),
  the metadata `delete` (silently did nothing), "prices were never given" (they
  were — to a duplicate product).
- **Surface contradictions before acting.** Twice the user asked for a destructive
  action ("delete all products") that the data contradicted; surfacing the real
  numbers changed their decision both times. They chose the smaller fix each time.
- Explain in plain words, short, no jargon. They often ask for "one sentence".
- They test manually afterwards and report back — leave clear test steps.
