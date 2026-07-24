import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative w-full bg-white small:min-h-screen">
      <div className="h-16 border-b border-neutral-200 bg-white">
        <nav className="content-container flex h-full items-center justify-center">
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
      <div className="w-full border-t border-neutral-200 py-6 mt-16">
        <div className="content-container mx-auto flex max-w-[1024px] flex-col items-center justify-between gap-y-4 small:flex-row small:gap-y-0">
          <div className="flex items-center gap-x-6 text-[11px] font-bold uppercase tracking-[0.05em] text-neutral-950">
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
          <div className="text-[11px] font-normal text-neutral-600">
            © 2026 BACOOLA All rights reserved
          </div>
        </div>
      </div>
    </div>
  )
}
