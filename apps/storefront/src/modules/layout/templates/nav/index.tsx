import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import HeaderLinks from "@modules/layout/components/header-links"
import AccountDropdown from "@modules/layout/components/account-dropdown"
import PromoBanner from "@modules/layout/components/promo-banner"
import { retrieveCustomer } from "@lib/data/customer"

import WishlistNavButton from "@modules/layout/components/wishlist-nav-button"

export default async function Nav() {
  const [regions, locales, currentLocale, categories, customer] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
    listCategories({ limit: 1000 }),
    retrieveCustomer(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-50">
      <header className="relative h-[56px] mx-auto border-b border-[#ECECEC] bg-white transition-colors duration-200">
        <nav className="w-full h-full px-4 sm:px-8 small:px-12 max-w-[1550px] mx-auto flex items-center justify-between text-small-regular relative">
          
          {/* DESKTOP LAYOUT (1024px and wider) */}
          <div className="hidden small:grid grid-cols-3 items-center w-full h-full">
            
            {/* Left Section: Navigation links */}
            <div className="flex justify-start items-center h-full">
              <HeaderLinks categories={categories} />
            </div>

            {/* Center Section: Store Logo */}
            <div className="flex justify-center items-center">
              <LocalizedClientLink
                href="/"
                className="flex items-center hover:opacity-80 transition-opacity duration-200"
                data-testid="nav-store-link"
              >
                <img
                  src="/images/bacoola-logo.png"
                  alt="Bacoola"
                  className="h-[18px] w-auto select-none"
                />
              </LocalizedClientLink>
            </div>

            {/* Right Section: Actions */}
            <div className="flex justify-end items-center gap-x-[32px] text-[14px] font-semibold text-[#111111] tracking-wider uppercase h-full">
              <LocalizedClientLink
                href="/search"
                className="hover:text-[#555555] transition-colors duration-200"
              >
                Search
              </LocalizedClientLink>
              
              {customer ? (
                <AccountDropdown customer={customer} />
              ) : (
                <LocalizedClientLink
                  href="/account"
                  className="hover:text-[#555555] transition-colors duration-200"
                  data-testid="nav-account-link"
                >
                  Log In
                </LocalizedClientLink>
              )}
              
              <WishlistNavButton />
              
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
          <div className="flex small:hidden items-center justify-between w-full h-full relative">
            
            {/* Left: Mobile SideMenu & Phone Logo */}
            <div className="flex-1 basis-0 flex items-center justify-start gap-x-4 h-full">
              <div className="h-full flex items-center">
                <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} categories={categories} />
              </div>
              <LocalizedClientLink
                href="/"
                className="flex sm:hidden items-center hover:opacity-80 transition-opacity duration-200"
                data-testid="nav-store-link-phone"
              >
                <img
                  src="/images/bacoola-logo.png"
                  alt="Bacoola"
                  className="h-[14px] w-auto select-none"
                />
              </LocalizedClientLink>
            </div>

            {/* Center: Tablet Logo (Absolutely Centered) */}
            <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center pointer-events-auto">
              <LocalizedClientLink
                href="/"
                className="flex items-center hover:opacity-80 transition-opacity duration-200"
                data-testid="nav-store-link-tablet"
              >
                <img
                  src="/images/bacoola-logo.png"
                  alt="Bacoola"
                  className="h-[14px] w-auto select-none"
                />
              </LocalizedClientLink>
            </div>

            {/* Right: Mobile Icons */}
            <div className="flex-1 basis-0 flex items-center justify-end gap-x-3 sm:gap-x-4 text-[#111111] h-full">
              <LocalizedClientLink href="/search" className="hover:opacity-70 transition-opacity duration-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </LocalizedClientLink>
              
              <LocalizedClientLink href="/account" className="hover:opacity-70 transition-opacity duration-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </LocalizedClientLink>
              
              <LocalizedClientLink href="/wishlist" className="hover:opacity-70 transition-opacity duration-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </LocalizedClientLink>
              
              <div className="h-full flex items-center">
                <Suspense
                  fallback={
                    <LocalizedClientLink href="/cart" className="flex items-center hover:opacity-70 transition-opacity duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] text-[#111111]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                      </svg>
                    </LocalizedClientLink>
                  }
                >
                  <CartButton />
                </Suspense>
              </div>
            </div>
          </div>

        </nav>
      </header>

      {/* Promotional Red Banner - dynamically shows sale % based on current category */}
      <PromoBanner categories={categories} />
    </div>
  )
}
