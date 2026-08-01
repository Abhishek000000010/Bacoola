# Bacoola — Why the site is slow

_Written 2026-07-29. Every number in section 2 was measured on that date, not
estimated. Numbers that are estimates are labelled as such._

> **Update 2026-08-01 — this diagnosis was confirmed and acted on.**
> See [`PERFORMANCE-FIXES-2026-08-01.md`](./PERFORMANCE-FIXES-2026-08-01.md) for
> what was changed, the before/after measurements, and what is still open.
> Development now runs against a **local Postgres copy**, not Neon; pages went
> from 3–12 s to under 0.3 s.

---

## 1. The one-line answer

**The website server, the database, and the customers are on three different
sides of the world, and building one page requires dozens of round trips
between the server and the database.**

Dozens of trips × a long distance = seconds of waiting.

Everything else in this document is a detail compared to that.

---

## 2. The measurements

### Where everything currently lives

| Piece | Provider | Location |
|---|---|---|
| Customers | — | 🇮🇳 India |
| Storefront | Vercel | Global edge |
| Backend (Medusa) | Render, service `srv-d9b6dal8nd3s73a90cfg` | 🇺🇸 **Oregon, US West** |
| Database (Postgres) | Neon, `ep-wandering-grass-aonp776h...ap-southeast-1` | 🇸🇬 **Singapore** |
| Redis | Upstash, `present-mullet-127116` | 🇺🇸 **US West** |

The backend and its database are roughly 12,000 km apart.

### Measured response times (production backend)

Taken from a machine in India, 3–4 samples each:

| Endpoint | Database work | Time to first byte |
|---|---|---|
| `/health` | **none** | **0.27s** |
| `/store/regions` | a few queries | ~1.0s |
| `/store/products?limit=12` | many queries | **5.6s – 8.7s** |

`/health` is the control. It proves the India → Oregon network trip costs
~270ms and nothing more. So the extra **5–8 seconds** on the products endpoint
is spent *inside* Render, waiting on the database.

### Measured network latency

| Route | Round trip |
|---|---|
| India laptop → Neon (Singapore) | 58–70ms |
| India laptop → Upstash Redis (US West) | 236ms |
| India laptop → Render (Oregon), no DB work | ~270ms |
| Render (Oregon) → Neon (Singapore) | ~180ms _(estimated — cannot be measured from outside)_ |

### Local development

Backend boot time, measured:

- Without Redis: **14 seconds**
- With Redis in US West: **44 seconds**

Local dev is slow for the same reason as production: the developer machine is
in India and the database is in Singapore, ~60ms per query.

---

## 3. The root cause, explained

A single product listing page is not one database query. Medusa v2 assembles it
from many sequential queries — products, then variants, then prices, then
inventory, then sales channels, and so on. Each query waits for the previous
one to return.

That means **latency multiplies by query count**. It does not add.

Rough arithmetic for a page doing ~40 sequential queries:

| Server → database distance | Per query | 40 queries |
|---|---|---|
| Oregon → Singapore (today) | ~180ms | **~7.2 seconds** |
| Mumbai → Singapore | ~60ms | ~2.4 seconds |
| Same machine | ~0.2ms | ~0.008 seconds |

The measured 5.6–8.7s matches the first row. That is the confirmation that this
is the actual cause and not a theory.

---

## 4. Contributing factors (real, but much smaller)

These are worth fixing eventually. None of them is why the site takes 5–8
seconds.

**4.1 — Render free instance: 0.1 CPU / 512 MB**
One tenth of a CPU core. Node has very little compute to work with. Also, free
instances **spin down after ~15 minutes of inactivity**, so the first visitor
after a quiet period pays a cold start. Measured: 7.3s cold vs 5.6s warm on the
same endpoint.

**4.2 — Customer → server distance**
India → Oregon is ~260ms. Unlike the database problem, this is paid **once per
request**, not dozens of times, so it is a much smaller share of the total. It
becomes the dominant cost only after the database problem is fixed.

**4.3 — Stale pre-built pages**
Product and category pages use `generateStaticParams` with no revalidation
hook, so a price change in admin does not appear on the live page until the
next full rebuild. This is a *correctness* problem, not a speed problem — see
A2 in `WEBSITE-ANALYSIS.md`.

**4.4 — Local Development Mode (Next.js)**
When testing on `localhost` using `npm run dev`, Next.js compiles pages, components, and server actions on-demand. Unlike a production build (`npm run build`) which serves highly optimized static files instantly, the development server adds significant local CPU overhead to every interaction (like switching a variant from Red to Green). This compounds with the remote database latency, making the local experience feel even slower than a deployed environment.

---

## 5. What is NOT the cause

**Redis is not the cause, and adding it does not fix this.**

Redis was added on 2026-07-29 for a different reason: reliability. The old
in-memory event bus lost queued jobs on restart (an order could fail to reach
Shiprocket) and in-memory locking could not prevent races. Redis fixes those.

Its effect on speed is small — perhaps 5–15% on repeat visits, from cached
reads skipping the database. A cache *miss* still pays the full Oregon →
Singapore crossing. Redis cannot fix an architecture where the app and its
database are on opposite sides of the Pacific.

Redis being in US West is **correct**, because it sits next to the backend. It
is not a contributor to the slowness.

---

## 6. The fix

Put the backend and the database in the same place, close to India.

| Option | Server → DB | Estimated page load | Trade-off |
|---|---|---|---|
| **A** — Backend to Mumbai, keep Neon Singapore | ~60ms | ~2–3s | Neon still handles backups. Only a 3× improvement — does not solve it. |
| **B** — Backend to Mumbai, managed Postgres in Mumbai (DigitalOcean / Aiven) | ~5–10ms | under 1s | Provider handles backups. Costs more. Neon appears to have no India region — confirm in their console. |
| **C** — Backend + Postgres on one VPS in Mumbai (e.g. Hostinger KVM 2) | ~0.2ms | under 1s | Fastest and cheapest. **Backups become entirely your responsibility.** |

_Page-load figures in this table are estimates derived from the arithmetic in
section 3. They have not been measured._

If Option C is chosen, off-machine automated backups must be set up **on day
one**, before any traffic. A backup stored on the same VPS is not a backup — if
that machine is lost, every order and customer record is lost permanently.

Whichever option is chosen, Redis should be moved to match the backend's new
region, and Vercel's serverless region should be set to `bom1` (Mumbai) so the
storefront's server-side calls do not cross an ocean to reach the backend.

---

## 7. Suggested order of work

1. ✅ **Redis** — done 2026-07-29. Fixes lost jobs and unsafe locking. Does not
   affect the speed problem.
2. **Move backend + database to Mumbai** — this is the speed fix. Everything in
   sections 2 and 3 is about this one change.
3. **Leave the Render free tier behind** — a paid instance or the VPS removes
   the 0.1 CPU ceiling and the cold starts (4.1).
4. **Add on-demand revalidation** — fixes the stale-price problem (4.3).

Do these one at a time. Changing two things at once makes it impossible to tell
which one helped or broke something.

---

## 8. Open questions

- Is the site live with real customers and real orders? This determines how
  carefully the database migration in step 2 must be done.
- Managed Postgres (safe, costs more) or self-hosted on the VPS (fastest,
  cheapest, backups are yours)?
- Does Neon offer an India region? Assumed no as of this writing; not verified.
