import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import HeaderLinks from "@modules/layout/components/header-links"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <header className="relative h-[76px] mx-auto border-b border-[#ECECEC] bg-white transition-colors duration-200">
        <nav className="w-full h-full px-6 sm:px-8 xl:px-10 mx-auto max-w-none text-small-regular">
          
          {/* DESKTOP LAYOUT (1024px and wider) */}
          <div className="hidden small:grid grid-cols-[1fr_auto_1fr] items-center w-full h-full">
            
            {/* Left Section: Navigation links */}
            <div className="flex justify-start items-center h-full">
              <HeaderLinks />
            </div>

            {/* Center Section: Store Logo */}
            <div className="flex justify-center items-center">
              <LocalizedClientLink
                href="/"
                className="text-[28px] leading-none font-semibold tracking-[0.22em] text-[#111111] hover:text-[#555555] transition-colors duration-200 uppercase select-none font-sans justify-self-center"
                data-testid="nav-store-link"
              >
                Bacoola
              </LocalizedClientLink>
            </div>

            {/* Right Section: Actions */}
            <div className="flex justify-end items-center gap-x-[30px] text-[14px] font-semibold text-[#111111] tracking-wider uppercase h-full">
              <LocalizedClientLink
                href="/store"
                className="hover:text-[#555555] transition-colors duration-200"
              >
                Search
              </LocalizedClientLink>
              
              <LocalizedClientLink
                href="/account"
                className="hover:text-[#555555] transition-colors duration-200"
                data-testid="nav-account-link"
              >
                My Account
              </LocalizedClientLink>
              
              <LocalizedClientLink
                href="/wishlist"
                className="hover:text-[#555555] transition-colors duration-200"
              >
                Wishlist
              </LocalizedClientLink>
              
              <div className="h-full flex items-center">
                <Suspense
                  fallback={
                    <LocalizedClientLink
                      className="hover:text-[#555555] transition-colors duration-200 uppercase font-semibold text-[14px]"
                      href="/cart"
                    >
                      Bag (0)
                    </LocalizedClientLink>
                  }
                >
                  <CartButton />
                </Suspense>
              </div>
            </div>
          </div>

          {/* MOBILE LAYOUT (Under 1024px) */}
          <div className="flex small:hidden items-center justify-between w-full h-full">
            
            {/* Left: Mobile SideMenu */}
            <div className="flex-1 basis-0 flex items-center justify-start text-[14px] font-semibold text-[#111111] uppercase tracking-wider">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>

            {/* Center: Mobile Logo */}
            <div className="flex items-center justify-center">
              <LocalizedClientLink
                href="/"
                className="text-xl font-bold tracking-[0.2em] text-[#111111] uppercase select-none"
                data-testid="nav-store-link"
              >
                Bacoola
              </LocalizedClientLink>
            </div>

            {/* Right: Mobile Bag Count */}
            <div className="flex-1 basis-0 flex items-center justify-end text-[14px] font-semibold text-[#111111] uppercase tracking-wider h-full">
              <Suspense
                fallback={
                  <LocalizedClientLink
                    className="hover:text-[#555555] transition-colors duration-200 uppercase font-semibold text-[14px]"
                    href="/cart"
                  >
                    Bag (0)
                  </LocalizedClientLink>
                }
              >
                <CartButton />
              </Suspense>
            </div>
          </div>

        </nav>
      </header>
    </div>
  )
}
