import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

const Help = () => {
  return (
    <section className="border border-neutral-200 px-5 py-5 lg:px-6">
      <h2 className="text-[12px] font-bold uppercase tracking-[0.05em] text-neutral-950 lg:text-[14px]">
        Need help?
      </h2>
      <div className="mt-3 flex flex-col gap-y-2 text-[12px] lg:text-[13px]">
        <LocalizedClientLink
          href="/contact"
          className="w-fit text-neutral-700 underline underline-offset-2 transition-colors hover:text-neutral-950"
        >
          Contact
        </LocalizedClientLink>
        <LocalizedClientLink
          href="/returns"
          className="w-fit text-neutral-700 underline underline-offset-2 transition-colors hover:text-neutral-950"
        >
          Returns &amp; Exchanges
        </LocalizedClientLink>
      </div>
    </section>
  )
}

export default Help
