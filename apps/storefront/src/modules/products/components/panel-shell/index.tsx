"use client"

import React, { useCallback, useEffect, useState } from "react"

/** Kept in sync with the slide transition below. */
const TRANSITION_MS = 480

/**
 * Decelerating curve -- the panel arrives fast and settles, which reads far
 * smoother than a symmetric ease for a large moving surface.
 */
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)"

/** Header height, so the scrim never dims the nav bar behind the panel. */
const HEADER_HEIGHT = "56px"

/**
 * The slide-over shell shared by the product-page panels (measurements,
 * details, store availability).
 *
 * Centralises the parts that must behave identically everywhere: the scrim, the
 * pinned header, Escape-to-close, and locking the page behind the panel. Only
 * the body scrolls, so the title and close button never scroll away -- which
 * was the main thing wrong with these panels when each rolled its own.
 */
export default function PanelShell({
  title,
  onClose,
  maxWidth = "520px",
  bodyClassName = "px-6 py-8 sm:px-8",
  children,
}: {
  title: string
  onClose: () => void
  maxWidth?: string
  /** Set to "" when the body manages its own padding and scrolling. */
  bodyClassName?: string
  children: React.ReactNode
}) {
  // Mounted off-screen, then slid in on the next frame; closing reverses it and
  // only unmounts once the slide-out has finished, so the panel animates both
  // ways instead of vanishing.
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const close = useCallback(() => {
    setShown(false)
    window.setTimeout(onClose, TRANSITION_MS)
  }, [onClose])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [close])

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Starts below the header so the nav bar stays readable rather than
          dimming behind the panel. */}
      <div
        style={{ top: HEADER_HEIGHT, transitionDuration: `${TRANSITION_MS}ms` }}
        className={`absolute inset-x-0 bottom-0 bg-black/25 transition-opacity ease-out ${
          shown ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          maxWidth,
          transitionDuration: `${TRANSITION_MS}ms`,
          transitionTimingFunction: EASE,
          // Promote to its own layer so the slide stays at 60fps instead of
          // repainting the panel's contents each frame.
          willChange: "transform",
        }}
        className={`absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-[-8px_0_32px_rgba(0,0,0,0.08)] transition-transform ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between px-6 py-5 sm:px-8">
          <h2 className="text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.08em] text-neutral-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="-mr-2 flex h-9 w-9 items-center justify-center text-neutral-900 transition-colors hover:text-neutral-500"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeWidth="1.5" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className={`min-h-0 flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>
      </aside>
    </div>
  )
}

/**
 * Tab row used by the panels that have two views.
 *
 * No rule under the row -- the underline is drawn per tab and wipes in from the
 * left on hover, so the only line on screen is the one that means something.
 */
export const PanelTabs = <T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}) => (
  <div className="flex gap-x-8">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        onClick={() => onChange(tab.id)}
        className={`group relative pb-2 text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.08em] transition-colors ${
          active === tab.id ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-900"
        }`}
      >
        {tab.label}
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 bottom-0 h-px origin-left bg-neutral-900 transition-transform duration-300 ease-out ${
            active === tab.id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
          }`}
        />
      </button>
    ))}
  </div>
)

/** Section heading + body, with consistent rhythm between blocks. */
export const PanelSection = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <section className="mt-10 first:mt-0">
    <h3 className="text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.12em] text-neutral-500">
      {title}
    </h3>
    <div className="mt-4">{children}</div>
  </section>
)
