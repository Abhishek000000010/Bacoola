"use client"

import React, { useState, Fragment, useEffect } from "react"
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react"
import { XMark, ArrowRightMini } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import useToggleState from "@lib/hooks/use-toggle-state"
import { Locale } from "@lib/data/locales"
import { clx } from "@modules/common/components/ui"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"

import CategoryTabs from "./CategoryTabs"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { CategoryKey } from "./menu-data"

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  categories?: HttpTypes.StoreProductCategory[]
}

const SideMenu: React.FC<SideMenuProps> = ({ regions, locales, currentLocale, categories = [] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<CategoryKey>("women")
  
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

  // Open and close helper functions
  const openDrawer = () => setIsOpen(true)
  const closeDrawer = () => setIsOpen(false)

  // Listen for Escape key (handled by Headless UI Dialog automatically, but good to ensure)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="h-full flex items-center">
      {/* Trigger Button */}
      <button
        data-testid="nav-menu-button"
        onClick={openDrawer}
        className="relative h-full flex items-center text-xs uppercase tracking-[0.2em] font-semibold transition-all ease-out duration-200 focus:outline-none hover:text-neutral-500"
      >
        Menu
      </button>

      {/* Navigation Drawer */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog onClose={closeDrawer} className="relative z-[9999]">
          {/* Backdrop Blur/Overlay */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/15 backdrop-blur-[2px] transition-opacity" />
          </TransitionChild>

          {/* Sliding Panel */}
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
                <TransitionChild
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="-translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-250"
                  leaveFrom="translate-x-0"
                  leaveTo="-translate-x-full"
                >
                  <DialogPanel className="pointer-events-auto w-screen max-w-full sm:max-w-[360px] md:max-w-[420px]">
                    <div className="flex h-full flex-col bg-white shadow-xl select-none">
                      {/* Top Bar with Tabs and Close button */}
                      <div className="relative flex flex-col pt-8">
                        <div className="absolute top-4 right-4 z-50">
                          <button
                            onClick={closeDrawer}
                            data-testid="close-menu-button"
                            className="p-2 text-neutral-400 hover:text-black transition-colors duration-200 focus:outline-none"
                            aria-label="Close panel"
                          >
                            <XMark className="w-6 h-6 stroke-[1.2px]" />
                          </button>
                        </div>

                        {/* Top Category Tabs (Women, Men, Teen, Kids) */}
                        <CategoryTabs activeTab={activeTab} onTabChange={setActiveTab} />
                      </div>

                      {/* Main Menu Scrollable Body */}
                      <div className="relative flex-1 overflow-y-auto px-8 py-4 scrollbar-none">
                        {categories
                          .filter((c) => c.parent_category_id === categories.find((cat) => cat.handle === activeTab)?.id)
                          .map((cat) => (
                            <LocalizedClientLink
                              key={cat.id}
                              href={`/categories/${cat.handle}`}
                              onClick={closeDrawer}
                              className={`block w-full text-left py-2 text-[12px] uppercase tracking-[0.12em] font-semibold transition-colors duration-200 ${
                                cat.name.toUpperCase().includes("SALE")
                                  ? "text-[#D01313] hover:text-[#B01010]"
                                  : "text-[#111111] hover:text-neutral-500"
                              }`}
                            >
                              {cat.name}
                            </LocalizedClientLink>
                          ))}
                      </div>

                      {/* Bottom Footer Section (Country / Language selection) */}
                      <div className="border-t border-neutral-100 px-8 py-6 flex flex-col gap-y-4 bg-neutral-50/50">
                        {!!locales?.length && (
                          <div
                            className="flex justify-between items-center text-xs tracking-wider uppercase text-neutral-600 hover:text-black transition-colors duration-200 cursor-pointer"
                            onMouseEnter={languageToggleState.open}
                            onMouseLeave={languageToggleState.close}
                          >
                            <LanguageSelect
                              toggleState={languageToggleState}
                              locales={locales}
                              currentLocale={currentLocale}
                            />
                            <ArrowRightMini
                              className={clx(
                                "transition-transform duration-150 w-4 h-4",
                                languageToggleState.state ? "-rotate-90" : ""
                              )}
                            />
                          </div>
                        )}

                        <div
                          className="flex justify-between items-center text-xs tracking-wider uppercase text-neutral-600 hover:text-black transition-colors duration-200 cursor-pointer"
                          onMouseEnter={countryToggleState.open}
                          onMouseLeave={countryToggleState.close}
                        >
                          {regions && (
                            <CountrySelect
                              toggleState={countryToggleState}
                              regions={regions}
                            />
                          )}
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150 w-4 h-4",
                              countryToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>

                        <div className="text-[10px] text-neutral-400 uppercase tracking-widest mt-2 select-none">
                          © {new Date().getFullYear()} Bacoola. All rights reserved.
                        </div>
                      </div>
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  )
}

export default SideMenu
