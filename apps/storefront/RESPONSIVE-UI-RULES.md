# Responsive UI Rules — Phone & Tablet without touching Desktop

**Status:** Desktop UI is DONE and frozen. We are now building the **phone** and **tablet**
layouts. The single hard requirement: **nothing we do may change how the site looks or
behaves at ≥ 1024px (desktop).**

Read this before editing any component's markup or classes.

---

## 1. Breakpoint map (this repo)

Tailwind here is **mobile-first**, and **two** breakpoint families are active at once
(the custom `screens` in `tailwind.config.js` are _added_ to Tailwind's defaults, not
replacing them). Unprefixed classes apply to _all_ sizes; a prefix means "at this width
**and up**".

| Device we're building | Width range      | Prefixes you may use                          |
| --------------------- | ---------------- | --------------------------------------------- |
| **Phone**             | 0 – 639px        | _unprefixed (base)_, `2xsmall:` 320, `xsmall:` 512 |
| **Tablet**            | 640px – 1023px   | `sm:` 640, `md:` 768                           |
| **DESKTOP — FROZEN**  | **≥ 1024px**     | `small:` 1024, `medium:` 1280, `large:` 1440, `xlarge:` 1680, `2xlarge:` 1920, and defaults `lg:` `xl:` `2xl:` |

> The desktop cutoff in this codebase is **`small:` (1024px)**. That is the wall.
> The nav (`src/modules/layout/templates/nav/index.tsx`) is the reference implementation.

---

## 2. The one rule that protects desktop

Because Tailwind cascades **upward** (base → larger), an unprefixed class that desktop
currently relies on will change desktop the moment you edit it for the phone. So:

> ### Never edit a class that desktop depends on. Add phone/tablet styles _below_ the desktop wall, and pin desktop first if it's living on a base class.

Concretely, the **allowed** vs **forbidden** edits:

**✅ Allowed**
- Add or change **unprefixed**, `2xsmall:`, `xsmall:`, `sm:`, `md:` utilities.
- Add brand-new `hidden small:block` / `small:hidden` markup branches (see §3).
- Add `small:`-and-up classes **only** when you are _locking in_ the value desktop
  already shows (see §4) — never to restyle desktop.

**❌ Forbidden**
- Editing or deleting any existing `small:`, `medium:`, `large:`, `xlarge:`, `2xlarge:`,
  `lg:`, `xl:`, `2xl:` class.
- Changing an **unprefixed** class that has **no** `small:` override, without first
  pinning desktop (§4). That base value _is_ desktop's value.
- Changing shared component props/logic (JS) that render differently on desktop.
- Touching layout containers (`content-container`, `max-w-*`, grid column counts) that are
  already correct at desktop, except behind a phone/tablet-only prefix.

---

## 3. Preferred pattern: branch the markup

When phone/tablet and desktop layouts differ **structurally** (different order, different
elements, different grid), do **not** try to bend one set of classes across all sizes.
Duplicate the block and toggle visibility at the wall — exactly what the nav does:

```tsx
{/* DESKTOP (≥1024px) — FROZEN, do not edit */}
<div className="hidden small:grid grid-cols-3 ...">
  ...desktop markup...
</div>

{/* PHONE + TABLET (<1024px) — edit freely here */}
<div className="flex small:hidden ...">
  ...phone/tablet markup...
</div>
```

Inside the mobile branch, use base classes for phone and `sm:`/`md:` for tablet:

```tsx
<img className="h-[12px] sm:h-[14px] w-auto" />   {/* phone 12px, tablet 14px */}
```

This is the safest approach: the desktop branch is visually isolated behind `small:hidden`
on the sibling, and editing the mobile branch can never leak upward.

---

## 4. When you must reuse one element across all sizes — "pin desktop first"

Sometimes duplicating markup is overkill and you want one element that just restyles.
If the property you want to change for phone is currently set by an **unprefixed** class
(no `small:` override), you must **lock desktop's current value at `small:` before you
change the base.**

```tsx
{/* BEFORE — desktop is relying on the base px-10 */}
<div className="px-10">

{/* AFTER — desktop still gets px-10 (pinned), phone now gets px-4 */}
<div className="px-4 small:px-10">
```

`small:px-10` re-declares the exact value desktop already had, so desktop is unchanged;
`px-4` only wins below 1024px. **Verify the pinned value matches what desktop rendered
before** — copy the real number, don't guess.

---

## 5. Workflow for every screen/component

1. **Snapshot desktop first.** Open the page at **1280px** (and 1440px) and screenshot /
   note the layout _before_ any edit. This is your regression baseline.
2. Make phone/tablet edits following §2–§4.
3. **Re-check desktop at ≥1024px** (test 1024, 1280, 1440). It must be **pixel-identical**
   to the baseline. If anything moved, you edited something above the wall — revert and
   redo behind a prefix.
4. Then check **tablet** (768px, and the 640–1023 range) and **phone** (360px, 390px,
   414px).
5. Prefer real breakpoints already in use (`sm:` 640, `md:` 768) over inventing new ones.

**Test widths:** phone `360 / 390 / 414`, tablet `640 / 768 / 1023`, desktop-guard
`1024 / 1280 / 1440`.

---

## 6. Quick checklist (paste into PR description)

- [ ] No existing `small:` / `medium:` / `large:` / `lg:` / `xl:` / `2xl:` class was edited or removed.
- [ ] Every changed base/unprefixed class either (a) doesn't affect desktop, or (b) had desktop's value pinned at `small:` first.
- [ ] Desktop at 1024 / 1280 / 1440 is identical to the pre-change baseline.
- [ ] No shared JS/prop/logic change alters desktop rendering.
- [ ] Phone (360–414) and tablet (640–1023) both verified.

---

## 7. Golden rule

> If you can't explain **why an edit cannot affect ≥1024px**, it's not safe. Branch the
> markup (§3) or pin desktop (§4) until you can.
