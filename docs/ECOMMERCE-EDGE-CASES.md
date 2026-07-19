# E-commerce Edge Cases — Bacoola & Any Online Store

_Last updated: 2026-07-19_

This is a big checklist of tricky situations ("edge cases") that any online store runs into. Each one is written in simple words as:

- **Scenario** — the tricky situation.
- **Should happen** — the correct behaviour.
- **Your site** — how Bacoola likely handles it today (based on the code), where known.

Tags: **(confirmed)** = seen in your code. **(check)** = should be verified on your setup. **(general)** = applies to all stores; verify.

Use this as a testing checklist. If you want, I can turn any section into real automated tests.

---

## 1. Discounts, Coupons & Promotions

**1.1 One-time coupon, two people at the same time (your example).**
- **Scenario:** A coupon can be used only once total. Two customers apply it at the same second. Both see the discounted price in their cart. Person A pays first; Person B pays 30 seconds later.
- **Should happen:** The discount is checked **again at the moment of payment**, not only when typed. Person A gets it. Person B's order should recalculate: either (a) tell B "this coupon is no longer available" and let them decide, or (b) charge B the full price only with clear warning — never silently charge full price with no message. The usage count must be updated **atomically** (with a lock/transaction) so it can never go to 2.
- **Your site:** (check) Medusa tracks promotion usage limits, but with **in-memory locking** (no Redis) the "check + increment" is not safe across a busy moment or multiple servers. Two near-simultaneous completions could both slip through. **Recommended:** verify usage-limit enforcement under load and move to Redis locking.

**1.2 Per-customer usage limit ("once per customer").**
- **Scenario:** Coupon is once **per customer**, but the same person tries twice, or makes a second account.
- **Should happen:** Block the second use for the same customer; consider blocking by email/phone/device to stop easy multi-account abuse.
- **Your site:** (check) Medusa supports per-customer limits for logged-in users; **guest checkout** makes "once per person" hard — a guest can reuse via a new email.

**1.3 Coupon on an already-discounted (sale) item — stacking.**
- **Scenario:** Item is already 40% off (sale price list). Customer adds a "10% off" coupon.
- **Should happen:** Decide the rule up front: does the coupon stack on the sale price, apply only to non-sale items, or not at all? Show the customer the final price clearly.
- **Your site:** (check) Your sales are **price lists** and coupons are **promotions** — they are different systems, so by default a coupon can stack on top of a sale. Confirm this is what you want.

**1.4 Minimum cart value, then the cart drops below it.**
- **Scenario:** Coupon needs ₹2,000 minimum. Customer reaches ₹2,100, applies it, then removes an item and drops to ₹1,500.
- **Should happen:** The coupon should automatically stop applying, and the customer should be told why. It must not silently stay applied.
- **Your site:** (check) Medusa re-evaluates promotion rules on cart change; verify the customer gets a clear message.

**1.5 Expired coupon still in the cart at payment.**
- **Scenario:** Coupon is valid until midnight. Customer applies at 11:59, pays at 12:01.
- **Should happen:** Re-check validity at payment; if expired, remove it and inform the customer before charging.
- **Your site:** (check) Must be verified — same "check at payment" principle as 1.1.

**1.6 Percentage coupon that makes the total zero or negative.**
- **Scenario:** 100% off, or a fixed ₹500 off on a ₹300 cart.
- **Should happen:** Total should never go below zero; shipping/tax handling must be defined; a ₹0 order should still create a valid order (or be blocked if you don't allow free orders).
- **Your site:** (check) Verify a fully-discounted cart can still complete and doesn't break the Razorpay amount (Razorpay needs a valid positive amount — a ₹0 order may need special handling).

**1.7 Fixed-amount coupon in the wrong currency.**
- **Scenario:** "₹500 off" coupon used by a customer in a USD region.
- **Should happen:** Only apply where the currency matches, or convert clearly.
- **Your site:** (confirmed) You already skip currency mismatches in sale pricing; confirm promotions do the same.

**1.8 Free-shipping threshold gaming.**
- **Scenario:** Free shipping over ₹1,000. Customer adds items to cross ₹1,000, gets free shipping, then removes items after.
- **Should happen:** Re-check the threshold whenever the cart changes.
- **Your site:** (check).

**1.9 Coupon applies to a specific product that is later removed.**
- **Scenario:** "10% off shoes" coupon, but the customer removes the shoes and keeps only a shirt.
- **Should happen:** Coupon gives ₹0 off (nothing qualifies) but shouldn't error; ideally tell the customer it no longer applies.
- **Your site:** (check).

**1.10 Code formatting: spaces, case, hidden characters.**
- **Scenario:** Customer types " save10 " with spaces, or "Save10" vs "SAVE10", or pastes with a hidden character.
- **Should happen:** Trim spaces, treat as case-insensitive (or clearly say codes are case-sensitive).
- **Your site:** (confirmed) The discount box sends the raw typed value — no trimming/upper-casing seen. **Recommend** trimming + normalising.

**1.11 Applying a coupon, abandoning, coming back.**
- **Scenario:** Customer applies a coupon, leaves, returns next day.
- **Should happen:** Re-validate the coupon on return (it may have expired or hit its limit).
- **Your site:** (check).

**1.12 Automatic promotion + manual coupon conflict.**
- **Scenario:** An automatic promo is running, and the customer also enters a manual code.
- **Should happen:** Define whether they combine or the best-one-wins.
- **Your site:** (confirmed) Your UI shows automatic promos as non-removable and manual ones as removable — good; confirm the combine rule.

**1.13 Removing a coupon.**
- **Scenario:** Customer removes an applied coupon.
- **Should happen:** Price returns to normal instantly.
- **Your site:** (confirmed) Works by re-applying the remaining codes. Note: **gift-card removal is not implemented** (empty function).

---

## 2. Inventory & Stock

**2.1 Last item, two buyers (oversell race).**
- **Scenario:** 1 unit left. Two people check out at once.
- **Should happen:** Only one succeeds; the other is told it's out of stock **before** payment, or refunded automatically if already charged.
- **Your site:** (check) Depends on inventory reservations at `cart.complete` + real locking (Redis). With in-memory locking, verify carefully.

**2.2 Cart max quantity vs real stock.**
- **Scenario:** Only 3 in stock, but the customer can select 10.
- **Should happen:** Cap the selector at available stock.
- **Your site:** (confirmed) Cart max is hardcoded to **10**, not real stock (`// TODO`). Needs fixing.

**2.3 Stock runs out while item sits in the cart.**
- **Scenario:** Item added, then it sells out before this customer pays.
- **Should happen:** At checkout, re-check and warn.
- **Your site:** (check).

**2.4 Reservation expiry.**
- **Scenario:** Stock is reserved when the cart is being paid, but the customer takes 20 minutes.
- **Should happen:** Reservations should expire so stock isn't locked forever by abandoned carts.
- **Your site:** (check).

**2.5 Backorder / pre-order.**
- **Scenario:** Product allows ordering even at 0 stock.
- **Should happen:** Clearly labelled; order accepted; fulfillment waits for restock.
- **Your site:** (confirmed) The product page respects `allow_backorder` and `manage_inventory` flags.

**2.6 Restock after "notify me".**
- **Scenario:** Item back in stock.
- **Should happen:** Optional "back in stock" email to interested customers.
- **Your site:** (general) Not present; nice future feature.

**2.7 Variant vs product stock.**
- **Scenario:** Size M is out, size L is in stock.
- **Should happen:** Only M is disabled, not the whole product.
- **Your site:** (confirmed) Stock is per-variant on the product page.

**2.8 Bundle/kit stock.**
- **Scenario:** A "set" made of multiple items — one component is out of stock.
- **Should happen:** The whole set shows out of stock.
- **Your site:** (general) Only relevant if you sell bundles.

---

## 3. Payments

**3.1 Charged but no order (browser dies after payment).**
- **Scenario:** Payment succeeds on Razorpay, then the customer's browser closes before the order is created.
- **Should happen:** A server-side **webhook** from Razorpay creates/completes the order anyway. Customer always gets what they paid for.
- **Your site:** (confirmed) **Risk.** Order is completed by the browser callback; no webhook safety net found. **High-priority fix.**

**3.2 Order created but not actually paid.**
- **Scenario:** Someone tries to place an order without paying.
- **Should happen:** Blocked — the server checks real payment status.
- **Your site:** (confirmed) Protected: your Razorpay wrapper checks real payment status during `authorizePayment`.

**3.3 Double payment / double click.**
- **Scenario:** Customer clicks "Place order" twice, or pays twice.
- **Should happen:** Only one charge and one order (idempotency).
- **Your site:** (confirmed) The button disables while submitting — helps, but confirm the backend won't create two orders for one cart.

**3.4 Payment succeeds late (after a timeout).**
- **Scenario:** Network is slow; your site gave up, but the bank still charged the customer.
- **Should happen:** Webhook reconciles; auto-refund if there's truly no order.
- **Your site:** (confirmed) Same gap as 3.1 — needs a webhook.

**3.5 Amount tampering.**
- **Scenario:** A malicious user tries to change the payable amount in the browser.
- **Should happen:** The server decides the amount, never the client.
- **Your site:** (confirmed) The payment session amount is created server-side from the cart — good.

**3.6 Floating-point amount rounding.**
- **Scenario:** A cart total lands on a non-integer in the smallest currency unit.
- **Should happen:** Round correctly so the payment gateway accepts it.
- **Your site:** (confirmed) You already patched this in the Razorpay wrapper (a ₹6907 cart used to fail) — good.

**3.7 Duplicate or out-of-order webhooks.**
- **Scenario:** The gateway sends the same webhook twice, or "captured" arrives before "authorized".
- **Should happen:** Handle each event idempotently; ignore duplicates.
- **Your site:** (general) Applies once you add webhooks (3.1).

**3.8 Refund race / partial refund.**
- **Scenario:** Refund requested while another refund or capture is happening; or refunding only part of an order.
- **Should happen:** Never refund more than paid; handle partials; don't double-refund.
- **Your site:** (check) Uses Medusa's refund flow; verify partials.

**3.9 Payment method abandoned (OTP/3DS screen closed).**
- **Scenario:** Customer opens the Razorpay popup and closes it.
- **Should happen:** Cart stays intact, clear "payment cancelled" message, can retry.
- **Your site:** (confirmed) Handled — `ondismiss` shows "Payment cancelled by user".

**3.10 Currency/region mismatch at payment.**
- **Scenario:** Cart currency and Razorpay account currency differ.
- **Should happen:** Only offer payment methods valid for that currency/region.
- **Your site:** (check) You're INR-focused; verify multi-region behaviour if you enable USD.

**3.11 Chargeback / fraud dispute.**
- **Scenario:** Customer disputes a charge with their bank.
- **Should happen:** You have a record (order, IP, address) to respond; order marked disputed.
- **Your site:** (general) Process/manual for now.

---

## 4. Cart & Session

**4.1 Same account, two devices.**
- **Scenario:** Customer edits the cart on phone and laptop at once.
- **Should happen:** One consistent cart; last change wins without losing items unexpectedly.
- **Your site:** (check) Cart is tied to a cookie/id; multi-device merging should be verified.

**4.2 Guest adds to cart, then logs in.**
- **Scenario:** Items in a guest cart; the customer signs in and had a saved cart too.
- **Should happen:** Merge the two carts sensibly (don't drop items).
- **Your site:** (check) Verify the guest→login cart merge.

**4.3 Cart edited in one tab, paid in another.**
- **Scenario:** Two tabs open; the totals differ.
- **Should happen:** The final charge uses the true server cart, not a stale tab.
- **Your site:** (confirmed-ish) Server is source of truth, but the storefront **caches the cart** (`force-cache`) — a stale tab could show wrong totals until revalidated.

**4.4 Price changed since the item was added.**
- **Scenario:** Price went up (or a sale ended) after adding to cart.
- **Should happen:** Show the current price and tell the customer it changed before they pay.
- **Your site:** (check) Re-pricing at the review step should be confirmed.

**4.5 Product deleted/unpublished while in cart.**
- **Scenario:** Admin removes a product that's in someone's cart.
- **Should happen:** Gracefully remove it from the cart with a message; don't crash checkout.
- **Your site:** (check).

**4.6 Region/currency changed mid-cart.**
- **Scenario:** Customer switches country while holding items.
- **Should happen:** Re-price to the new region; warn if items aren't available there.
- **Your site:** (confirmed) `updateRegion` updates the cart's region and revalidates prices — good; verify availability handling.

**4.7 Very large quantity.**
- **Scenario:** Customer enters 999,999.
- **Should happen:** Cap by stock and by a sane limit; don't overflow totals.
- **Your site:** (confirmed) Only capped at 10 in the UI; backend limits should be verified.

**4.8 Abandoned/expired cart.**
- **Scenario:** Cart sits for days.
- **Should happen:** Optionally expire it; free any reserved stock.
- **Your site:** (check).

---

## 5. Pricing (specific to how Bacoola works)

**5.1 A product in two sale categories.**
- **Scenario:** Item is in "women 2%" and "kids 35%".
- **Should happen:** The cheapest wins (Medusa's rule). Make sure this is intended.
- **Your site:** (confirmed) This is exactly what happened; we removed 3 mis-filed products.

**5.2 Sale ends while the customer is mid-checkout.**
- **Scenario:** The sale percent is changed/removed in admin during a live checkout.
- **Should happen:** Define whether the customer keeps the price they saw or gets the new one; be consistent and clear.
- **Your site:** (check) Prices rebuild fast now (~1–2s), so a change can land mid-session.

**5.3 Duplicate/stale sale price lists.**
- **Scenario:** Two generated price lists for one category (old + new).
- **Should happen:** Only one; the newest wins.
- **Your site:** (confirmed / fixed) This was the recent bug — old lists are now always cleared.

**5.4 Tax-inclusive vs tax-exclusive display.**
- **Scenario:** Is the shown price with or without tax (GST)?
- **Should happen:** Consistent across product page, cart, and invoice; correct for the region.
- **Your site:** (check).

**5.5 Rounding after discount.**
- **Scenario:** 2% off ₹1,955 = ₹1,915.9.
- **Should happen:** Round consistently everywhere so cart, payment, and invoice match to the rupee.
- **Your site:** (confirmed) Sale prices use `Math.round`; make sure tax/coupon rounding matches.

**5.6 Zero or negative computed price.**
- **Scenario:** A near-100% discount rounds to ₹0.
- **Should happen:** Guard against ₹0/negative unless you truly allow free items.
- **Your site:** (confirmed) Sale generation skips prices that round to ≤ 0 — good.

---

## 6. Orders & Fulfillment

**6.1 Auto-fulfillment before payment fully settles.**
- **Scenario:** Order is auto-sent to Shiprocket the instant it's placed.
- **Should happen:** Only ship truly paid orders; don't ship if payment later fails/reverses.
- **Your site:** (confirmed) You auto-fulfill on `order.placed`. Since orders only get created after payment is verified, this is mostly safe, but confirm no path creates an unpaid order that then ships.

**6.2 Fulfillment fails silently (Shiprocket down).**
- **Scenario:** Order placed, but Shiprocket rejects it.
- **Should happen:** The failure is visible to an admin, not hidden in logs.
- **Your site:** (confirmed / good) You already record the failure reason on the order metadata so admins can see "paid but not shipped".

**6.3 Duplicate fulfillment on event retry.**
- **Scenario:** The `order.placed` event fires twice.
- **Should happen:** Don't create two shipments.
- **Your site:** (confirmed / good) You check for existing fulfillments before creating one.

**6.4 Fulfill more than ordered / partial fulfillment.**
- **Scenario:** Only some items ship, or a bug tries to ship extra.
- **Should happen:** Never ship more than ordered; support partial shipments.
- **Your site:** (confirmed) You only fulfill the still-unfulfilled quantity — good.

**6.5 Cancel after shipping.**
- **Scenario:** Customer cancels once the parcel is already moving.
- **Should happen:** Block cancel or convert to a return; don't refund automatically for a shipped item.
- **Your site:** (check).

**6.6 Address change after order.**
- **Scenario:** Customer wants a new delivery address after placing.
- **Should happen:** Allow only before dispatch; sync to Shiprocket.
- **Your site:** (check).

**6.7 Two orders, one payment / one order, two payments.**
- **Scenario:** Reconciliation mismatch.
- **Should happen:** Every order maps to exactly one successful payment.
- **Your site:** (check) Tighten once webhooks exist.

---

## 7. Shipping

**7.1 Pincode not serviceable.**
- **Scenario:** Delivery address isn't covered by the courier.
- **Should happen:** Tell the customer before payment.
- **Your site:** (check) Verify Shiprocket serviceability is checked at checkout, not after.

**7.2 Missing weight/dimensions.**
- **Scenario:** A product has no shipping weight set.
- **Should happen:** Fall back to a default or block, so the courier request doesn't fail.
- **Your site:** (check) Shiprocket needs these; a missing value can fail fulfillment (this is the kind of thing that hits 6.2).

**7.3 Shipping price changes between cart and checkout.**
- **Scenario:** Rate updates while shopping.
- **Should happen:** Show the final rate before payment.
- **Your site:** (check).

**7.4 COD vs prepaid.**
- **Scenario:** Cash on delivery option.
- **Should happen:** Different flow (no online payment), fraud checks, COD limits.
- **Your site:** (general) Only if you offer COD.

---

## 8. Returns & Refunds

**8.1 Refund amount on a discounted order.**
- **Scenario:** Customer paid ₹980 (after 2% off) and returns the item.
- **Should happen:** Refund what they actually paid (₹980), not the original ₹1,000.
- **Your site:** (check).

**8.2 Partial return of a multi-item order.**
- **Scenario:** Return 1 of 3 items, where a coupon applied to the whole order.
- **Should happen:** Fairly split the discount across items for the refund.
- **Your site:** (check) This is a classic tricky calculation — verify.

**8.3 Return more than purchased.**
- **Scenario:** A bug/abuse tries to return 3 when 2 were bought.
- **Should happen:** Blocked.
- **Your site:** (check).

**8.4 Refund to an expired/closed card.**
- **Scenario:** The original card no longer works.
- **Should happen:** Gateway handles it or you offer store credit.
- **Your site:** (general) Razorpay-dependent.

**8.5 Refund after the money was already refunded.**
- **Scenario:** Double refund attempt.
- **Should happen:** Idempotent — refund only once.
- **Your site:** (check).

---

## 9. Accounts & Auth

**9.1 Duplicate email / account.**
- **Scenario:** Same email tries to register twice, or guest + account share an email.
- **Should happen:** One account per email; link past guest orders.
- **Your site:** (check).

**9.2 Guest wants to see past orders.**
- **Scenario:** A guest returns and wants order history.
- **Should happen:** Order lookup by email + order number, or "claim your order" flow.
- **Your site:** (confirmed) There is an order **transfer** flow (`order/[id]/transfer/...`) — verify it's safe (token-based).

**9.3 Password reset race / token reuse.**
- **Scenario:** Reset link used twice, or after expiry.
- **Should happen:** One-time, time-limited tokens.
- **Your site:** (general) Medusa default; verify.

**9.4 Email change with pending orders.**
- **Scenario:** Customer changes email mid-order.
- **Should happen:** Order notifications still reach the right place.
- **Your site:** (check).

**9.5 Deleting an account that has orders.**
- **Scenario:** Customer asks to delete their data.
- **Should happen:** Keep order records for legal/accounting, anonymise personal data.
- **Your site:** (general) Plan for privacy requests.

---

## 10. Concurrency & Races (the general pattern behind many above)

**10.1 Read-then-write races.**
- **Scenario:** Two processes read a value, both change it, one overwrites the other (this is exactly the sale-price duplicate bug you had).
- **Should happen:** Use locks/transactions or "delete-all + rebuild" style operations.
- **Your site:** (confirmed) Fixed for sale prices; the general risk remains anywhere using **in-memory locking** (no Redis).

**10.2 At-least-once events (duplicates).**
- **Scenario:** The same event is delivered twice.
- **Should happen:** Every handler is idempotent (safe to run twice).
- **Your site:** (confirmed) Auto-fulfill and sale-sync are idempotent — good pattern to keep.

**10.3 Lost events on restart.**
- **Scenario:** Server restarts while an event is queued.
- **Should happen:** A durable queue (Redis) keeps it.
- **Your site:** (confirmed) In-memory bus = events can be lost. See analysis A1.

**10.4 Clock skew / timezones.**
- **Scenario:** "Sale ends at midnight" — whose midnight?
- **Should happen:** Store times in UTC; be explicit about the store's timezone (IST).
- **Your site:** (check).

---

## 11. Tax, Currency & Region

**11.1 GST/tax calculation and display.** Correct rate per product category and region; consistent inclusive/exclusive display.
**11.2 Price per region.** A product may have no price in some region → don't show it as buyable there. (Your sale code already skips variants without a base price.)
**11.3 Currency rounding.** Different currencies round differently; keep cart, payment, and invoice consistent.
**11.4 Region switch changes availability.** Some items ship only to some regions.
- **Your site:** (check) INR is the main path; test thoroughly before enabling more regions.

---

## 12. Data & Input Handling

**12.1 Weird characters.** Emojis, right-to-left text, very long names in address/first name.
- **Should happen:** Accept or clearly limit; never crash the courier/invoice.
**12.2 Injection attempts.** Script/SQL in text fields.
- **Should happen:** Framework escapes these (Medusa/Next do), but never trust raw input.
**12.3 Decimal or negative quantity.** "2.5" or "-1".
- **Should happen:** Only whole positive numbers.
**12.4 Huge image/file upload (admin).** 
- **Should happen:** Size limits; Cloudinary handles storage.
- **Your site:** (check) Validate quantity and address field lengths.

---

## 13. Abuse & Fraud

**13.1 Coupon farming** — bots creating accounts to reuse "one per customer" codes.
**13.2 Card testing** — many small payment attempts to test stolen cards.
- **Should happen:** Rate-limit payment attempts; use Razorpay's fraud tools.
**13.3 Scalping / bots** buying limited stock instantly.
- **Should happen:** Rate limits, purchase caps per customer.
**13.4 Fake reviews / spam** (if you add reviews).
- **Your site:** (general) Add rate limiting on auth and checkout endpoints.

---

## 14. Time & Scheduling

**14.1 Flash-sale thundering herd.** Everyone hits at 12:00 → server + price rebuild load spike.
- **Should happen:** Cache hard, pre-build sale prices before the sale opens.
**14.2 Sale start/end timing.** A sale that should start at 9am starts late because a job was missed.
- **Your site:** (check) Sale prices are event-driven now; a scheduled full re-sync adds safety.
**14.3 Scheduled job missed after downtime.**
- **Should happen:** Jobs catch up or are idempotent.

---

## 15. Notifications

**15.1 Order confirmation email fails.** Payment worked but the email didn't send.
- **Should happen:** Retry; the order still exists and is visible in the account.
**15.2 Duplicate emails.** Event fired twice → two "order confirmed" emails.
- **Should happen:** Idempotent sending.
**15.3 Shipping/tracking updates.** Keep the customer informed as Shiprocket status changes.
- **Your site:** (check) Confirm confirmation + tracking emails are wired and reliable.

---

## Suggested priority for testing

1. **Coupon at payment time** (1.1, 1.5) and **oversell** (2.1) — money/stock correctness.
2. **Charged-but-no-order** (3.1) — needs the Razorpay webhook.
3. **Price/stock re-check before payment** (4.4, 2.3).
4. **Refunds on discounted orders** (8.1, 8.2).
5. **Region/tax** (11.x) before expanding beyond India.

---

_Want me to turn any of these into real automated tests, or build the fixes (Razorpay webhook, Redis setup, real cart stock limits)? I can take them one at a time._
