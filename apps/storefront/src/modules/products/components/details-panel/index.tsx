"use client"

import React, { useState } from "react"
import {
  DELIVERY_OPTIONS,
  ProductDetails,
  RETURN_POLICY,
  careIconKind,
  careLabel,
  isProhibition,
} from "@lib/util/product-details"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PanelShell, { PanelSection, PanelTabs } from "../panel-shell"

type Tab = "care" | "delivery"

/**
 * Textile care symbols, drawn rather than shipped as images so they inherit
 * colour and stay crisp at any size. A prohibition (do_not_*) is the base
 * symbol with a cross through it, which is how the real standard works.
 */
const CareIcon = ({ code }: { code: string }) => {
  const kind = careIconKind(code)
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[22px] w-[22px] shrink-0 text-neutral-900"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      {kind === "wash" && <path d="M3 8h18l-1.5 11a2 2 0 01-2 1.8H6.5a2 2 0 01-2-1.8L3 8zM3 8l3-3.5" />}
      {kind === "bleach" && <path d="M12 3l9 17H3L12 3z" />}
      {kind === "iron" && <path d="M3 17h18l-1.5-7c-.3-1.4-1.4-2.4-2.8-2.4H8.5L3 12v5z" />}
      {kind === "dryclean" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <text x="12" y="16" textAnchor="middle" fontSize="9" stroke="none" fill="currentColor">
            P
          </text>
        </>
      )}
      {kind === "tumble" && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="1" />
          <circle cx="12" cy="12" r="5" />
        </>
      )}
      {isProhibition(code) && <path d="M4 4l16 16" strokeWidth="1.4" />}
    </svg>
  )
}

/**
 * Slide-over holding the reference, what the garment is made of and how to look
 * after it, plus the store's delivery and returns terms.
 *
 * Composition/origin/care are per product; the deliveries tab is store-wide
 * copy from lib/util/product-details.
 */
export default function DetailsPanel({
  details,
  onClose,
}: {
  details: ProductDetails
  onClose: () => void
}) {
  const [tab, setTab] = useState<Tab>("care")

  const bullets = (items: string[]) => (
    <ul className="space-y-2.5">
      {items.map((line) => (
        <li key={line} className="flex gap-x-3 text-[12px] lg:text-[14px] leading-relaxed text-neutral-800">
          <span className="mt-[7px] h-[3px] w-[3px] shrink-0 rounded-full bg-neutral-400" />
          {line}
        </li>
      ))}
    </ul>
  )

  return (
    <PanelShell title="Details" onClose={onClose}>
      {details.ref && (
        <p className="text-[12px] lg:text-[14px] uppercase tracking-[0.08em] text-neutral-500">
          Ref. {details.ref}
        </p>
      )}

      <div className={details.ref ? "mt-6" : ""}>
        <PanelTabs<Tab>
          active={tab}
          onChange={setTab}
          tabs={[
            { id: "care", label: "Composition and care" },
            { id: "delivery", label: "Deliveries and returns" },
          ]}
        />
      </div>

      <div className="mt-10">
        {tab === "care" ? (
          <>
            {details.composition.length > 0 && (
              <PanelSection title="Composition">{bullets(details.composition)}</PanelSection>
            )}

            {details.origin.length > 0 && (
              <PanelSection title="Origin">
                <dl>
                  {details.origin.map((o) => (
                    <div key={`${o.label}-${o.value}`} className="flex justify-between gap-x-4 py-2.5">
                      <dt className="text-[12px] lg:text-[14px] text-neutral-500">{o.label}</dt>
                      <dd className="text-right text-[12px] lg:text-[14px] text-neutral-900">{o.value}</dd>
                    </div>
                  ))}
                </dl>
              </PanelSection>
            )}

            {details.care.length > 0 && (
              <PanelSection title="Care">
                <ul className="grid grid-cols-1 gap-x-6 gap-y-4">
                  {details.care.map((code) => (
                    <li key={code} className="flex items-center gap-x-3.5">
                      <CareIcon code={code} />
                      <span className="text-[12px] lg:text-[14px] leading-snug text-neutral-800">
                        {careLabel(code)}
                      </span>
                    </li>
                  ))}
                </ul>
              </PanelSection>
            )}
          </>
        ) : (
          <>
            <PanelSection title="Deliveries">
              <ul>
                {DELIVERY_OPTIONS.map((option) => (
                  <li key={option.name} className="flex items-baseline justify-between gap-x-4 py-4">
                    <div>
                      <div className="text-[12px] lg:text-[14px] text-neutral-900">{option.name}</div>
                      <div className="mt-1 text-[12px] lg:text-[14px] text-neutral-500">{option.time}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] lg:text-[14px] font-bold text-neutral-900">{option.price}</div>
                      {option.note && (
                        <div className="mt-1 text-[12px] lg:text-[14px] text-neutral-500">{option.note}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </PanelSection>

            <PanelSection title="Returns">
              <p className="text-[12px] lg:text-[14px] leading-relaxed text-neutral-800">
                You have <strong className="font-bold">{RETURN_POLICY.windowDays} days</strong> to
                return your order by any of the following methods:
              </p>

              <ul className="mt-5">
                {RETURN_POLICY.methods.map((m) => (
                  <li key={m.name} className="flex items-center justify-between py-4">
                    <span className="text-[12px] lg:text-[14px] text-neutral-900">{m.name}</span>
                    <span className="text-[12px] lg:text-[14px] font-bold text-neutral-900">{m.price}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-4">
                {RETURN_POLICY.notes.map((note) => (
                  <p key={note} className="text-[12px] lg:text-[14px] leading-relaxed text-neutral-500">
                    {note}
                  </p>
                ))}
              </div>

              <p className="mt-6 text-[12px] lg:text-[14px] leading-relaxed text-neutral-800">
                See{" "}
                <LocalizedClientLink
                  href="/help"
                  className="font-bold underline underline-offset-2 hover:text-neutral-500"
                >
                  Help
                </LocalizedClientLink>{" "}
                for more information.
              </p>
            </PanelSection>
          </>
        )}
      </div>
    </PanelShell>
  )
}
