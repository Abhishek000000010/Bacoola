import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Refunds",
  description: "Manage your refunds and bank details.",
}

export default function RefundsPage() {
  return (
    <div className="w-full flex flex-col items-center pt-[40px] font-sans text-[#111111] text-center px-4">
      <div className="w-full max-w-[600px] mx-auto flex flex-col items-center">
        
        <h1 className="text-[15px] font-semibold tracking-normal uppercase mb-3">
          REFUNDS
        </h1>
        
        <p className="text-[13px] font-normal leading-[1.7] mb-[64px]">
          Choose how you would like to be refunded for your orders paid on delivery.
        </p>
        
        <div className="flex flex-col items-center gap-y-1 max-w-[400px]">
          <p className="text-[13px] font-normal leading-[1.6]">
            To be able to add your bank details, you first need to have<br />made a purchase.
          </p>
          <p className="text-[13px] font-normal leading-[1.6]">
            You can find more information about refunds on our <LocalizedClientLink href="/help" className="font-bold underline hover:text-[#555555] transition-colors">Help</LocalizedClientLink><br />page.
          </p>
        </div>
        
      </div>
    </div>
  )
}
