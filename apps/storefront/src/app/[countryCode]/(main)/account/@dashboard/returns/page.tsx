import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Returns",
  description: "Manage your returns and exchanges.",
}

export default function Returns() {
  return (
    <div className="w-full flex flex-col pt-[40px] font-sans text-[#111111]">
      <div className="w-full max-w-[480px] mx-auto flex flex-col px-0">
        <h1 className="text-[15px] font-semibold tracking-normal mb-[16px] text-center uppercase">
          EXCHANGES AND RETURNS
        </h1>

        <p className="text-[13px] font-normal leading-[1.7] mb-[56px] text-center w-full">
          You have <span className="font-semibold">30 days</span> from the dispatch date to exchange or return your order.
        </p>

        <div className="w-full flex flex-col items-start text-left mb-[48px]">
          <h2 className="text-[12px] font-bold uppercase mb-[4px] tracking-normal">
            HOME COLLECTION
          </h2>
          <p className="text-[12px] font-normal uppercase mb-[24px]">
            FREE
          </p>

          <p className="text-[13px] font-normal leading-[1.7] mb-[24px] max-w-[480px]">
            Request the collection of your parcel online and we will send a carrier within 24 to 48 hours to the address of your choice.
          </p>

          <p className="text-[13px] font-semibold leading-[1.7] max-w-[480px]">
            This service is only available for one return per purchase.
          </p>

          <button className="w-full h-[44px] bg-[#111111] text-white hover:bg-[#333333] transition-colors mt-[24px] text-[11px] font-bold tracking-wider uppercase">
            REQUEST COLLECTION
          </button>
        </div>

        <div className="w-full text-center mt-[32px] pb-8">
          <p className="text-[13px] leading-[1.7]">
            Find more information about returns on the{" "}
            <LocalizedClientLink href="/help" className="font-bold hover:text-[#555555] transition-colors">
              Help
            </LocalizedClientLink>{" "}
            page.
          </p>
        </div>
      </div>
    </div>
  )
}
