# Bacoola Website — Deep Analysis (Problems & Improvements)

_Last updated: 2026-07-19_

This document explains, in simple words, what is good and what is risky about the Bacoola online store, and what you can improve. It is based on reading the actual code (backend + storefront), not general guesses.

## How to read this

Each problem has:
- **What it is** — plain explanation.
- **Why it matters** — what can go wrong for a customer or for you.
- **Severity** — 🔴 High (can lose money/orders), 🟠 Medium (bad experience or risk), 🟡 Low (cleanup/nice-to-have).
- **Fix** — the suggested direction.

A tag **(seen in code)** means I confirmed it in your files. **(needs check)** means it is likely but should be verified on your live setup.

---

## 1. The big picture (your stack)

- **Backend:** Medusa v2 (2.17.2) — handles products, carts, orders, pricing, payments, fulfillment.
- **Storefront:** Next.js (App Router) — the actual website customers see.
- **Payments:** Razorpay (India).
- **Shipping:** Shiprocket (auto-pushed when an order is placed).
- **Images:** Cloudinary.
- **Custom pieces you built:** category-driven auto-sale pricing, auto-fulfillment to Shiprocket, a landing-pages CMS, and a Razorpay compatibility wrapper.

Overall it is a capable, real store. The main risks are around **production reliability**, **payment edge cases**, and a few **half-finished features**.

---

## 2. Problems

### A. Production reliability (the most important group) 🔴

**A1. Everything runs "in memory" — no Redis. (seen in code / startup logs)**
- **What it is:** Your backend uses the default in-memory Event Bus, in-memory Locking, and a "fake Redis" cache. The startup log literally says: _"Local Event Bus installed. This is not recommended for production"_ and _"redisUrl not found. A fake redis instance will be used."_
- **Why it matters:**
  - **Events can be lost.** Things like "send order to Shiprocket" and "update sale prices" run on events. If the server restarts or crashes at the wrong moment, that event is gone — the order may never reach Shiprocket, the sale price may never update.
  - **No retries.** If an event handler fails once, it is not retried.
  - **Can't run more than one server.** If you ever run 2 copies for scale, they don't share events or locks, so the sale-price duplicate bug (which we just fixed) and other races come back.
- **Fix:** Add Redis and configure the Redis Event Bus, Redis Cache, Redis Workflow Engine, and Redis Locking modules. This is the single biggest step toward being production-ready.
- **Severity:** 🔴 High.

**A2. Product/category pages are pre-built and can go stale in production. (seen in code)**
- **What it is:** In production, `products/[handle]` and category pages use `generateStaticParams`, so Next.js builds them ahead of time. There is **no revalidation hook** that refreshes a product page when its price changes in admin.
- **Why it matters:** You change a price in admin, but the live product page keeps showing the old price until the next full rebuild. (In local dev this doesn't happen because dev mode is always fresh — which is why it only bites in production.)
- **Fix:** Add on-demand revalidation: when a product/price changes, call `revalidateTag`/`revalidatePath` for that product (triggered by a Medusa subscriber hitting a small storefront webhook), or set a short `revalidate` time.
- **Severity:** 🟠 Medium (🔴 in production).

---

### B. Payments & checkout 🔴

**B1. The order is completed by the browser, not by a payment webhook. (seen in code)**
- **What it is:** After Razorpay payment, the browser's `handler` callback calls `placeOrder()`. The good news: your backend **does** re-check the real payment status with Razorpay during `cart.complete` (the Razorpay wrapper's `authorizePayment` calls `getPaymentStatus`), so a fake "I paid" cannot create an order. The bad news: **if the browser closes/crashes/loses network right after payment but before `placeOrder` runs, the customer is charged but no order is created.**
- **Why it matters:** Money taken, no order, no email, nothing on Shiprocket. The customer is angry and you have to reconcile by hand. There is **no server-side webhook** to catch these "paid but no order" cases (no webhook route found, and the webhook secret defaults to a dummy value).
- **Fix:** Add a Razorpay **webhook** on the backend that, on `payment.captured`, finds the matching cart and completes the order if it isn't already. Set a real `RAZORPAY_WEBHOOK_SECRET`. This makes checkout reliable even when the browser dies.
- **Severity:** 🔴 High.

**B2. Hardcoded test Razorpay key as a fallback. (seen in code)**
- **What it is:** The pay button falls back to `rzp_test_T6Dp9BJO5sSWlW` if the env var is missing.
- **Why it matters:** If the real key isn't set in production, customers silently pay into a **test** account (no real money) — or checkout looks like it works but nothing is actually collected.
- **Fix:** Remove the hardcoded fallback; fail loudly if the key is missing.
- **Severity:** 🟠 Medium.

**B3. Dummy default secrets. (seen in code)**
- **What it is:** `RAZORPAY_WEBHOOK_SECRET` defaults to `"razorpay_webhook_secret"`, Shiprocket email/password default to `dummy@example.com` / `dummypassword`.
- **Why it matters:** If an env var is forgotten, the system keeps running with insecure/wrong values instead of stopping. Failures become silent.
- **Fix:** Validate required secrets at startup and refuse to boot if missing (your storefront already does this for one key — do the same on the backend for all critical secrets).
- **Severity:** 🟠 Medium.

**B4. Debug logging left in the payment route. (seen in code)**
- **What it is:** `payment-sessions/route.ts` has `console.log("[rzp-route] override HIT ... cart_id=...")`.
- **Why it matters:** Logs cart IDs on every payment, adds noise, and can leak identifiers into logs.
- **Fix:** Remove or switch to the proper logger at debug level.
- **Severity:** 🟡 Low.

---

### C. Cart 🟠

**C1. The cart is cached with `force-cache`. (seen in code)**
- **What it is:** `retrieveCart` uses `cache: "force-cache"` plus tag-based revalidation. It works because every cart change calls `revalidateTag`, but it is fragile: miss one revalidation and the customer sees a stale cart (old price, old items).
- **Why it matters:** Wrong totals shown, "why did my discount disappear" confusion.
- **Fix:** Consider `no-store` for the cart (it's per-user and changes often), or make very sure every mutation revalidates.
- **Severity:** 🟠 Medium.

**C2. `getOrSetCart` can create two carts in a race. (seen in code)**
- **What it is:** It reads "is there a cart?" then creates one. Two fast requests with no cart cookie can both create a cart.
- **Why it matters:** Rare, but leads to a "lost items" feeling if the wrong cart wins.
- **Fix:** Minor — acceptable for now; can be guarded later.
- **Severity:** 🟡 Low.

**C3. Cart items are not re-validated for stock/price at the final step. (needs check)**
- **What it is:** Between adding to cart and paying, price or stock can change. There's no obvious "revalidate the cart right before payment" guard.
- **Why it matters:** Customer pays an old price, or buys something now out of stock.
- **Fix:** Re-price and re-check stock at the review/payment step and warn if something changed.
- **Severity:** 🟠 Medium.

---

### D. Pricing & sales (your custom system) 🟠

**D1. A product in two sale categories gets the cheapest sale.**
- **What it is:** By design, Medusa serves the lowest price. So a "women 2%" product also sitting in "kids 35%" shows 35%. (We just cleaned up 3 such products.)
- **Why it matters:** Not a bug, but easy to misfile a product and give an unintended discount.
- **Fix:** Add an admin check/report that flags products sitting in more than one sale category. (I can build this.)
- **Severity:** 🟡 Low (but easy to trip on).

**D2. Some ways of adding products to a sale don't auto-update prices. (seen in code / your notes)**
- **What it is:** Adding products to a category **from the category page** emits no event, so the sale price isn't generated until a manual re-sync. Only editing from the **product page** or editing the category triggers it.
- **Why it matters:** You add products to a sale and they show full price until someone runs the script.
- **Fix:** Either always assign from the product side, or add a scheduled full re-sync, or add a manual "Re-sync sale prices" admin button.
- **Severity:** 🟠 Medium.

**D3. Category names bake in the percent.**
- **What it is:** Names like "Sale 40% off" are auto-rewritten to match the percent, but the URL handle (`women-sale-40-v2`) stays wrong forever.
- **Why it matters:** URLs read as a different discount than reality (cosmetic, but confusing).
- **Fix:** Consider a name like just "Sale" with the number shown from metadata only. (Documented as a known rough edge.)
- **Severity:** 🟡 Low.

**D4. If a base price changes, the sale price doesn't refresh by itself. (needs check)**
- **What it is:** The sale price = base × (1 − percent). If you change the base price of a product, the generated sale list only rebuilds if that product edit fires the right event.
- **Why it matters:** Sale price can lag the real base price.
- **Fix:** Confirmed covered by `product.updated` in most cases; add the scheduled re-sync as a safety net.
- **Severity:** 🟡 Low.

---

### E. Inventory & stock 🟠

**E1. Cart quantity is capped at a hardcoded 10, not real stock. (seen in code)**
- **What it is:** In the cart, `maxQuantity = 10` with a `// TODO: grab the actual max inventory`.
- **Why it matters:** A customer can put 10 in the cart even if only 3 exist → they only find out it fails at checkout (or you oversell).
- **Fix:** Use the real available inventory for the max.
- **Severity:** 🟠 Medium.

**E2. Overselling the last item (classic race). (needs check)**
- **What it is:** Two people buy the last unit at the same time. Whether Medusa reserves stock at the right moment must be verified (reservations happen on cart completion).
- **Why it matters:** You promise stock you don't have; one order can't be shipped.
- **Fix:** Ensure inventory reservations are enabled and stock is checked at `cart.complete`, not just on the product page. (See the Edge Cases document.)
- **Severity:** 🟠 Medium.

---

### F. Half-finished features 🟠

**F1. Gift cards do nothing. (seen in code)**
- **What it is:** `applyGiftCard`, `removeGiftCard`, `removeDiscount` in the storefront are commented out / empty. But there is a **Gift Voucher page** and a gift-card module in the UI.
- **Why it matters:** A customer may try to use a gift card and nothing happens — looks broken.
- **Fix:** Either implement gift cards end-to-end or hide the UI until ready.
- **Severity:** 🟠 Medium.

**F2. Demo routes still shipped. (seen in code)**
- **What it is:** `/demo/product`, `/demo/products` routes exist in the storefront.
- **Why it matters:** Dead pages that can be indexed by Google or confuse users.
- **Fix:** Remove before launch.
- **Severity:** 🟡 Low.

---

### G. Security & secrets 🟠

**G1. Order confirmation page is reachable by anyone with the order ID. (seen in code)**
- **What it is:** `order/[id]/confirmed` loads the order by ID with no ownership check (normal for guest checkout; the ID is a long random string).
- **Why it matters:** Low risk because IDs are hard to guess, but the order details are viewable by link.
- **Fix:** Acceptable for guest flow; for logged-in users, scope to the customer. Keep IDs unguessable (they are).
- **Severity:** 🟡 Low.

**G2. CORS and cookie settings depend on env being exactly right. (seen in code)**
- **What it is:** `cookieSecure` is turned off when `ADMIN_CORS` contains `localhost`. Fine locally, but a misconfigured production env could weaken cookies.
- **Why it matters:** Wrong env → insecure cookies in production.
- **Fix:** Add a startup check that production uses HTTPS/secure cookies and real CORS origins.
- **Severity:** 🟡 Low.

---

### H. Code quality / maintainability 🟡

- **Leftover `console.log` and many `TODO` comments** (payment route, cart item, etc.).
- **Commented-out dead code** (gift card functions, tooltips).
- **Diagnostic scripts** in `src/scripts` (some are one-offs) — fine, but keep them tidy.
- **Fix:** A cleanup pass before launch; move debug logs behind the logger; delete dead code.
- **Severity:** 🟡 Low.

---

## 3. Improvements (recommended order)

**Do first (before real customers / scale):**
1. Add **Redis** (event bus, cache, workflow engine, locking). — fixes A1.
2. Add a **Razorpay webhook** to complete "paid but browser died" orders + set a real webhook secret. — fixes B1/B3.
3. Add **on-demand revalidation** so price changes show up on live pages. — fixes A2.
4. **Validate required secrets at startup**; remove hardcoded test key. — fixes B2/B3.

**Do soon:**
5. Use **real inventory** for cart max + re-check stock at checkout. — fixes E1/E2.
6. **Re-check price + stock right before payment** and warn on changes. — fixes C3.
7. Finish or hide **gift cards**. — fixes F1.
8. Add an admin **"Re-sync sale prices"** button + a nightly full re-sync. — fixes D2/D4.

**Do later (polish):**
9. Cross-listing report for products in multiple sales. — D1.
10. Remove demo routes, clean logs/dead code. — F2/H.
11. Rethink sale category names/handles. — D3.

---

## 4. Quick wins (small effort, real value)

- Remove the `console.log` in the payment route.
- Remove the hardcoded Razorpay test key fallback.
- Delete `/demo/*` routes.
- Add a startup check for `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SHIPROCKET_*`.
- Show the real max quantity in the cart instead of 10.

---

_See the companion document **ECOMMERCE-EDGE-CASES.md** for a long list of tricky situations (like two people using a one-time coupon at once) and what should happen in each._
