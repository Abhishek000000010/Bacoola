import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative w-full bg-white small:min-h-screen">
      <div className="h-16 bg-white pt-8 pb-4">
        <nav className="max-w-[1024px] w-full mx-auto px-4 flex h-full items-center justify-center">
          <LocalizedClientLink
            href="/"
            className="flex items-center hover:opacity-80 transition-opacity duration-200"
            data-testid="store-link"
          >
            <img
              src="/images/bacoola-logo.png"
              alt="Bacoola"
              className="h-[18px] w-auto select-none"
            />
          </LocalizedClientLink>
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
      <div className="w-full border-t-0 small:border-t border-neutral-200 py-6 mt-6 small:mt-16">
        <div className="max-w-[1024px] w-full px-4 mx-auto flex flex-col items-start justify-between gap-y-6 small:flex-row small:items-center small:gap-y-0">
          <div className="flex flex-col items-start gap-y-5 small:flex-row small:items-center small:gap-x-6 text-[12px] lg:text-[14px] font-bold uppercase tracking-[0.05em] text-neutral-950">
            <LocalizedClientLink href="#" className="transition-colors hover:text-neutral-500">
              Privacy Policy and Cookies
            </LocalizedClientLink>
            <LocalizedClientLink href="#" className="transition-colors hover:text-neutral-500">
              Terms and Conditions
            </LocalizedClientLink>
            <LocalizedClientLink href="#" className="transition-colors hover:text-neutral-500">
              Ethics Channel
            </LocalizedClientLink>
          </div>
          <div className="text-[12px] lg:text-[14px] font-normal text-neutral-600">
            © 2026 BACOOLA All rights reserved
          </div>
        </div>
      </div>
    </div>
  )
}
