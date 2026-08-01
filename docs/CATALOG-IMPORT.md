# Bacoola — Catalogue Import Runbook

_Last updated: 2026-07-29_

How to turn a scraped CSV into products that actually sell: priced in every
region, in stock, shippable, and rendering correctly on the storefront.

Verified against two imports:

| Import | Script | Marker | Result |
|---|---|---|---|
| Men → T-shirts (2026-07-28) | `import-mango-v2.ts` | `mango-newnow-v2` | 90 products, 184 colourways, 1038 variants |
| Men → New Now (2026-07-29) | `import-men-newnow.ts` | `mango-men-newnow-v1` | 72 products, 392 variants, + 5 existing adopted |

Where something is an assumption, it says so.

**If you are importing a new category, read sections 3, 4 and 5.** Section 2 is
what went wrong the first time and why — worth reading once so you do not repeat
it.

---

## 1. TL;DR

A row in a scraped CSV is **one colourway, not one product**. Getting that wrong
is what broke the first import.

| # | Symptom | Real cause | Fix |
|---|---|---|---|
| 1 | `next/image` runtime error, no images | Supplier CDN host not in `next.config.js` `remotePatterns` | Whitelist the host |
| 2 | Every product "out of stock" | `createProductsWorkflow` creates inventory **items** but not **levels** | `fix-missing-inventory-levels.ts` |
| 3 | Import silently stocked nothing | Level creation ran over *all* items incl. ones that already had levels; the duplicate threw and aborted the loop | Filter to items with zero levels; wrap each batch in try/catch |
| 4 | Grid showed one tile per **size** | Products had no Colour option, so `variant-cards.ts` hit its per-variant fallback | Import colour as a real option |
| 5 | Same shirt appeared 16–20 times | Each colourway imported as its own product | Group rows by style ID |
| 6 | No prices outside India | Only INR written; a USD region exists | Write both currencies |
| 7 | Shiprocket would reject fulfilment | No weight/dimensions on variants | Set dims at variant level on create |
| 8 | PDP showed a photo of a different outfit | Scrape captured a `-009` asset — a **composite** of two editorial shots, not a garment photo | Probe the suffix whitelist; `repair-mango-galleries.ts` |

**The recurring lesson:** the storefront was correct every single time. Six of
these seven were bad data wearing a UI bug's clothing. Check the data before
touching a component.

---

## 2. The data-model insight

Scraped rows look like separate products but are not. The product URL carries
both identities:

```
https://shop.mango.com/in/en/p/men/t-shirts/basics/slim-fit-t-shirt-180gsm/37011432/96/00
                                                                          ^style   ^colour
```

Extract with `/\/(\d{6,})\/(\d+)\//` → style `37011432`, colour `96`.

- **Style ID** = the garment = one Medusa product.
- **Colour code** = one option value on that product.
- 193 CSV rows → **90 products in 184 colourways**. 9 rows were duplicate
  scrapes of the same colourway; 1 row was junk.

Image assets encode the same thing, which is what makes everything downstream
recoverable:

| Asset | Pattern | Example |
|---|---|---|
| Product shot | `{style}-{colour}-{NNN}` | `37011432-96-002` |
| Colour swatch | `{style}-{colour}-020?wid=40` | `37011432-96-020?wid=40` |

The swatch URL is **derivable even when the CSV did not capture it** — single
colour products render no colour bullets, so 47 of 184 had an empty swatch
column. Constructing the `-020` URL resolved all of them.

### Colour names

The scrape captured numeric codes only. Do **not** hand-map codes to names —
they are supplier-internal and guessing produces wrong data.

Instead, sample the swatch image. `scripts/extract-colors.js` (see §5) fetches
each swatch, crops the middle 50% with `sharp` to dodge the border ring,
averages it to one pixel, and matches the result to a fixed palette by
"redmean" distance. 184/184 resolved, zero failures.

Names are chosen greedily **per style** so two colourways of the same garment
can never collide into one option value.

---

## 3. What a sellable product needs in this project

A product missing any of these looks fine in the admin and fails on the
storefront. This checklist is the whole point of this document.

| Field | Where | Why | If missing |
|---|---|---|---|
| `status: published` | product | — | Invisible in store API |
| `sales_channels` | product | Must be the channel linked to a **stock location** | Invisible, or permanently out of stock |
| `shipping_profile_id` | product | Fulfilment needs it | Checkout has no shipping options |
| `category_ids` | product | — | Not in category listings |
| `images` + `thumbnail` | product | — | Blank cards |
| Option titled exactly **`Color`** | product | `CustomProductDetails` matches `optionTitle === "color"` | No swatch UI |
| Option titled exactly **`Size`** | product | Same match on `"size"` | No size chips |
| `prices` in **every** region currency | variant | Amounts are **decimal** (3899 = ₹3,899), not cents | Priceless / broken region |
| `manage_inventory: true` | variant | — | Stock not tracked |
| Inventory **level** at the stock location | variant | Items ≠ levels; see §1 #2 | Permanently "out of stock" |
| `weight`, `length`, `width`, `height` | **variant** | Medusa's fulfilment workflow reads variant dims only, never product-level | Shiprocket throws "Missing dimensions/weight" |
| `metadata.color_hex` | variant | Exact swatch colour | Falls back to the coarse `colorHexMap` |
| `metadata.thumbnail` | variant | Grid card image per colour | Storefront guesses by filename |
| `metadata.image_order` | variant | Ordered **product image IDs** = the PDP gallery | Gallery shows all colours mixed |

### The two storefront contracts that dictate all of this

**`apps/storefront/src/lib/util/variant-cards.ts`** — splits grid cards on the
Colour option. With no colour option it falls back to **one card per variant**,
which for a size-only product means one tile per size. This is why colour must
be a real option, not a naming convention.

**`apps/storefront/src/modules/products/templates/CustomProductDetails.tsx`** —
matches option titles case-insensitively but **exactly** (`"color"`, `"size"`).
`"Colour"` renders the swatch UI in `variant-cards` but *not* here. Use
`Color`. Reads `metadata.image_order` as product image IDs for the gallery.

---

## 4. The pipeline

Four scripts, **in this order**. Order matters — see the warnings.

```bash
cd apps/backend

# 0. one-off per scrape: sample swatch colours -> mango-colors.json
node <path-to>/extract-colors.js

# 1. build products/variants/prices/dims from the CSV
npx medusa exec ./src/scripts/import-mango-v2.ts -- --apply

# 2. re-host supplier images onto Cloudinary, rewrite URLs
npx medusa exec ./src/scripts/migrate-mango-images.ts -- --apply

# 3. create inventory levels (import makes items, not levels)
npx medusa exec ./src/scripts/fix-missing-inventory-levels.ts

# 4. pin per-colourway gallery + card image
npx medusa exec ./src/scripts/set-mango-variant-images.ts -- --apply
```

> **Step 4 must run after step 2.** Re-hosting replaces a product's images,
> which mints **new image IDs**. Any `image_order` written before step 2 points
> at IDs that no longer exist and the gallery silently falls back.

Every script is idempotent and dry-runs by default; `-- --apply` writes.

### Verify

```bash
npx medusa exec ./src/scripts/audit-mango-import.ts
npx medusa exec ./src/scripts/diag-mango-stock.ts
node ./scripts/catalog-health.js     # plain SQL: imported vs hand-made, CDN sweep
```

> `catalog-health.js` deliberately uses raw SQL rather than `query.graph`. A
> graph query that expands `variants.inventory_items.inventory.location_levels`
> across ~1000 variants does not come back in reasonable time — the first
> version of this check hung for 15 minutes and had to be killed. Note also that
> product options attach via the **`product_product_option`** join table;
> `product_option` has no `product_id` column, and its rows are not soft-deleted
> with the product, so counting it directly over-reports.

---

## 4b. The Men → New Now import (worked example)

`import-men-newnow.ts` is `import-mango-v2.ts` adapted to a **mixed** feed, and
is the better template to copy for the next category. Full run:

```bash
cd apps/backend
export MANGO_CSV=C:/Projects/bacoola-2/Men_NewNow.csv
node scripts/fetch-mango-colourways.js      # real colours + per-colour sizes
node scripts/extract-swatch-colors.js       # measured hex per colourway
npx medusa exec ./src/scripts/import-men-newnow.ts -- --apply
npx medusa exec ./src/scripts/repair-mango-galleries.ts -- --apply
npx medusa exec ./src/scripts/migrate-mango-images.ts -- --apply
npx medusa exec ./src/scripts/fix-missing-inventory-levels.ts
npx medusa exec ./src/scripts/set-mango-variant-images.ts -- --apply
```

> **Run all of it.** Stopping partway leaves symptoms that look like storefront
> bugs: skip `fix-missing-inventory-levels` and every new variant reads "out of
> stock"; skip `set-mango-variant-images` and the PDP shows *every colour's*
> photos at once, because `image_order` is what tells it which images belong to
> the selected colourway.

Four things it handles that the T-shirt importer does not:

- **Per-type dimensions.** The feed is shirts, jeans, blazers, shorts, a
  backpack and a pair of sunglasses. `DIMS_BY_TYPE` keys off the category
  segment of the product URL (`/p/men/blazers/…`); anything unlisted falls back
  to the folded-apparel default.
- **Numeric sizes.** Waist sizes 38–56 appear alongside XS–XXL, so `sizeRank`
  parses numbers instead of looking up a fixed list.
- **Two href columns.** A grid's first tile scrapes into
  `…imageLink href` rather than `…mediaWrapper href`. Every column ending in
  `href` is tried, first hit wins.
- **Overlap with an earlier import.** 5 of the 77 styles were already in the
  catalogue as T-shirts. Creating them again would mean two products for one
  garment and a handle collision, so the importer **adopts** them: appends the
  New Now category to the existing product and skips creation.

Result: 77 products in `men-new-now-v2` (72 new + 5 adopted), 392 new variants,
all with dimensions, SKUs, INR+USD prices, inventory levels and per-colourway
`image_order`.

### Do not trust the scrape for images

A grid scrape only captures the tiles the page had lazily rendered. In the New
Now run that left **22 of 72 products with a single image**, and for two of them
that image was a `-009` asset — which is not a photo of the garment at all but a
**composite**: two editorial shots side by side in one wide, letterboxed file.
On the PDP it reads as "wrong product", which is how it was first reported.

Asset URLs are fully derivable (`{style}-{colour}-{suffix}`), so the real image
set is recoverable by **probing suffixes** rather than re-scraping. Sampled
from the live CDN:

| Suffix | What it is | Use |
|---|---|---|
| `500` `501` `505` `508` | Hero / editorial crop (`508` is landscape) | Gallery, card |
| `001`–`008`, `010`–`012` | Model shots: front, back, side | Gallery, card |
| `900`, `052`–`055` | Flat packshot on white (accessories use `05x`) | Gallery |
| `022` `023` `030` | Fabric macro | Gallery, deeper down |
| `009` | **Composite two-up. Never usable.** | Excluded |
| `020` | Colour swatch (40px) | Colour naming only |

`repair-mango-galleries.ts` probes that whitelist per colourway, rebuilds the
gallery in that order, keeps anything already re-hosted on its Cloudinary URL,
and drops `-009`. Run it whenever a scrape looks thin:

```bash
npx medusa exec ./src/scripts/repair-mango-galleries.ts -- --apply
npx medusa exec ./src/scripts/migrate-mango-images.ts -- --apply
npx medusa exec ./src/scripts/set-mango-variant-images.ts -- --apply
```

On the New Now catalogue that took every product to at least 4 images
(+247 total, 2 composites removed) and put a hero or model shot on every card.

`REPAIR_MARKER` scopes it to one import.

### Recovering colourways: fetch the product page, don't probe

`scripts/fetch-mango-colourways.js` fetches each product page and writes
`src/scripts/mango-colourways.json`. A plain `fetch` with a normal UA works —
the site is behind Akamai, but it is the automation footprint that gets blocked,
not ordinary requests. The page is server-rendered and carries everything:

| Data | Where | Why it matters |
|---|---|---|
| Sibling colourways | swatch `href` | The scrape only ever caught one |
| Real colour names | `alt="Colour Emerald Green"` | Beats sampling a 40px swatch against a palette |
| Per-colour size run + availability | button `id` (`sizeAvailable.38` / `sizeUnavailable.46`) | **23 of 39** multi-colour styles have a different available-size run per colour |
| Price | `itemProp="price"` | — |

Men → New Now: 77 scraped colourways → **162**, zero fetch failures.

**Parse off element IDs and itemProps, never CSS class names.** The classes carry
a per-build hash — the scrape's `SizePicker-module__WzYwuW__…` is
`SizeItem-module__Zv0vzW__…` today — so class-based selectors break on every
Mango deploy.

Three traps this cost, all of which produced plausible-looking wrong data:

- **The size button's `id` holds Mango's internal size CODE, not the label.** A
  shirt's XS–XXL run is `sizeAvailable.19` … `.24`. Waist-sized items happen to
  have code == label, so the bug is invisible until a lettered garment imports
  as "19, 20, 21". Read the label from the nested `sizeInfo` span.
- **Sold-out sizes append a class to that same span** (`sizeInfo …__notAvailable`),
  so a regex anchored on `sizeInfo">` silently drops exactly the sold-out ones.
- **The swatch strip is not always one garment in several colours.** On suiting,
  every swatch links to a **different style id** — separate products sharing a
  picker. Taking the code without checking the style invented 21 colourways with
  no assets on the CDN at all. Keep only same-style swatches.

The swatch URL lives in a `srcSet`, so stop the match at whitespace or you
capture two URLs plus a descriptor and get something unfetchable.

### A scraped row is one colourway — and often the ONLY one

The New Now CSV is 77 rows, 77 styles, **one colour each**, and only 27 of the
77 rows captured sibling colour bullets at all. So the storefront shows Navy
where Mango shows six colours. That is a scrape gap, not an import bug.

Sibling colourways *are* recoverable the same way — probe `{style}-{code}-020`
for codes `00`–`99`; the swatch asset exists for every real colourway. Verified
on style `37051330`: probing returned `02, 05, 35, 44, 56, 99`, exactly the six
swatches on Mango's page.

**What probing cannot recover is per-colour sizes.** Assuming every colourway
offers the scraped one's size run invents variants — the phantom-size mistake in
§1 #4, wearing a different hat. Re-scrape with the colour bullets captured
rather than guess.

### Markers are per-import, and that matters

`MANGO_MARKER` is `mango-newnow-v2` — an unfortunate name, since it belongs to
the **T-shirt** import, not to New Now. Each importer deletes only products
carrying **its own** marker. Re-using a marker for a new category makes each
import silently delete the other's catalogue.

When adding an importer, register its marker in two places or the tooling
quietly ignores its products:

- `set-mango-variant-images.ts` → the `MARKERS` array
- `scripts/catalog-health.js` → the `MARKERS` array

---

## 5. Importing a NEW category

1. **Scrape it** with a browser-extension scraper (Web Scraper.io / Instant Data
   Scraper) running in your normal Chrome. Do not use Playwright — the site sits
   behind Akamai and blocks automation footprints. An extension in a real
   browser session is not detectable because it is not automation.

2. **Remap the column names.** This is the only part that always needs editing.
   Extension output uses CSS class names, which change per scrape and per page
   template:

   ```
   ProductTitle-module__7eNKla__productTitle
   SinglePrice-module__y_asRG__center
   SizePicker-module__WzYwuW__sizePickerAddToBagButton 2
   ColorBullet-module__BR9stq__colorBullet src
   ```

   Update the `COL` map and the size/image column loops at the top of
   `import-mango-v2.ts`. Everything else is generic.

3. **Point at the new CSV** — `MANGO_CSV=/path/to/file.csv`, or edit `CSV_PATH`.

4. **Change the category match.** `import-mango-v2.ts` currently hunts for a
   handle matching `/t-?shirts?/i`. Change that regex.

5. **Change the marker.** `MANGO_MARKER` scopes what a re-run deletes. Use a new
   value per category (`mango-shirts-v1`, …) or the next import will delete the
   previous category's products.

6. **Whitelist any new image host** in `apps/storefront/next.config.js` under
   `images.remotePatterns`, or `next/image` throws at runtime.

7. Run the pipeline in §4, then verify.

### Assumptions that may not hold for other categories

- Size values come from a size-picker column. Shoes/accessories use different
  widgets and may need a different column and a different `SIZE_ORDER`.
- Every colourway is assumed to share one price. Rows carry their own price, so
  this holds today, but a per-size price would need a variant-level change.
- `DIMS` is folded-apparel (400g, 30×25×4cm). **Wrong for shoes, bags, coats.**
  Set per category.
- The USD rate is a fixed `85` (`MANGO_USD_RATE`). Seed data, not accounting.
- A few scraped image URLs are already **dead at the supplier** (403) and will
  never re-host. `prune-dead-supplier-images.ts` drops them and repoints the
  thumbnail if that was the casualty; run `set-mango-variant-images.ts` again
  afterwards, because removing an image invalidates the ids in `image_order`.
  2 of 480 in the New Now run.
- `extract-swatch-colors.js` **merges** into `mango-colors.json` and skips
  colourways already resolved. It used to overwrite, which would have stripped
  the T-shirt import's colour names the moment a second category was scraped.

---

## 6. Gotchas that cost real time

- **Two "Bacoola Storefront" sales channels and two "Main Warehouse" stock
  locations exist.** Only one channel has a stock location linked. Picking
  `[0]` blindly is a coin flip that yields a catalogue that is invisible or
  permanently out of stock. Always select the channel that *has* stock
  locations. Worth cleaning up the duplicates separately.

- **`createInventoryLevelsWorkflow` throws on an item that already has a level
  at that location.** Filter to items with zero levels first, and wrap each
  batch, or one duplicate aborts the whole run silently.

- **`updateProductVariantsWorkflow` batch input is flat objects carrying their
  own `id`** — `{ product_variants: [{ id, prices }] }`. The
  `{ selector, update }` shape is only for applying one change to many, and
  fails with "Product variant ID is required when doing a batch update".

- **Variant price updates replace the whole price set.** Re-send existing
  currencies or you will wipe them.

- **Cloudinary can fetch a remote URL server-side** —
  `cloudinary.uploader.upload(remoteUrl)`. This bypasses the File Module (whose
  provider only takes base64), and turns ~1500 images from an hours-long
  download/re-encode into a few minutes. Product images are plain URLs either
  way, so nothing downstream notices.

- **Derive the Cloudinary `public_id` from the source URL** (basename + URL
  hash). That makes re-runs free: `overwrite: false` resolves the existing
  asset instead of re-uploading. It also keeps the `{style}-{colour}-{NNN}`
  basename, which is how step 4 recovers which image belongs to which colour
  *after* re-hosting.

- **`medusa exec` must run from `apps/backend`.** From the repo root it fails
  with "must be run inside a Medusa project".

- **Adding files to `src/scripts` restarts `medusa develop`.** Harmless, but it
  briefly drops port 9000 mid-run.

- **Deleting products breaks live carts.** Old cart cookies point at deleted
  variants; `retrieveCart()` then returns null and the checkout page calls
  `notFound()` — a bare 404 with no explanation. Empty your bag after a
  re-import.

---

## 7. Why images must not stay on the supplier's CDN

Hotlinking `media.mango.com` works on localhost and fails in every other way:

- The supplier can enable referer checks at any time; every image becomes a
  broken box with no warning.
- Retired products take their image URLs with them.
- It uses their bandwidth and serves their copyrighted photography from your
  site.

`migrate-mango-images.ts` fixes this permanently: 1532 images copied to
Cloudinary, 0 failures, 0 URLs still pointing at the supplier. It is safe to
re-run and will pick up any stragglers.

**Anything new must go through it before the site is public.**
