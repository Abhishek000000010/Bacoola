import { Metadata } from "next"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const metadata: Metadata = {
  title: "Refunds",
  description: "Manage your refunds and bank details.",
}

export default function RefundsPage() {
  return (
    <div className="w-full flex flex-col items-center pt-[90px] font-sans text-[#111111] text-center">
      <div className="w-full max-w-[560px] mx-auto flex flex-col items-center">
        
        <h1 className="text-[14px] font-bold uppercase tracking-[0.05em] mb-4">
          Refunds
        </h1>
        
        <p className="text-[13px] font-normal tracking-wide leading-relaxed mb-16">
          Choose how you would like to be refunded for your orders paid on delivery.
        </p>
        
        <div className="flex flex-col items-center gap-y-2">
          <p className="text-[13px] font-normal tracking-wide">
            To be able to add your bank details, you first need to have made a purchase.
          </p>
          <p className="text-[13px] font-normal tracking-wide">
            You can find more information about refunds on our <LocalizedClientLink href="/help" className="font-bold hover:text-[#555555] transition-colors">Help</LocalizedClientLink> page.
          </p>
        </div>
        
      </div>
    </div>
  )
}
