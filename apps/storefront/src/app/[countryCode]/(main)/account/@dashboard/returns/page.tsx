import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Returns",
  description: "Manage your returns and exchanges.",
}

export default function Returns() {
  return (
    <div className="w-full flex flex-col items-center pt-[54px] font-sans text-[#111111]">
      <div className="w-full max-w-[480px] mx-auto flex flex-col items-center px-0">
        <h1 className="text-[21px] font-semibold leading-none tracking-[0.01em] mb-[24px] text-center uppercase">
          Exchanges and Returns
        </h1>

        <p className="text-[13px] font-normal leading-[1.7] mb-[58px] text-center max-w-[520px]">
          You have <span className="font-semibold">30 days</span> from the dispatch date to exchange or return your order.
        </p>

        <div className="w-full flex flex-col items-start text-left mb-[32px]">
          <h2 className="text-[15px] font-semibold uppercase leading-none mb-[9px]">
            Home Collection
          </h2>
          <p className="text-[13px] font-normal uppercase mb-[16px] tracking-[0.01em]">
            Free
          </p>

          <p className="text-[13px] font-normal leading-[1.7] mb-[18px] max-w-[470px]">
            Request the collection of your parcel online and we will send a carrier within 24 to 48 hours to the address of your choice.
          </p>

          <p className="text-[13px] font-semibold leading-[1.7] max-w-[470px]">
            This service is only available for one return per purchase.
          </p>

          <button className="w-full h-[50px] bg-[#111111] text-white hover:bg-[#333333] transition-colors mt-[30px] text-[13px] font-semibold tracking-[0.03em] uppercase">
            Request Collection
          </button>
        </div>

        <div className="w-full text-center mt-[8px]">
          <p className="text-[13px] leading-[1.7]">
            Find more information about returns on the{" "}
            <LocalizedClientLink href="/help" className="font-semibold hover:text-[#555555] transition-colors underline underline-offset-2">
              Help
            </LocalizedClientLink>{" "}
            page.
          </p>
        </div>
      </div>
    </div>
  )
}
