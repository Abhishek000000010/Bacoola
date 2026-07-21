import React from "react"
import CloudinaryImage from "@modules/common/components/cloudinary-image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export interface SplitBannerProps {
  items?: any[]
  fallbackItems?: any[]
}

const defaultFallback = [
  { title: "Shirts", desktop_image: "/images/campaign-1.jpg", button_link: "/store", button_text: "SEE ALL" },
  { title: "Trousers", desktop_image: "/images/campaign-2.jpg", button_link: "/store", button_text: "SEE ALL" },
]

export const SplitBanner: React.FC<SplitBannerProps> = ({ items, fallbackItems = defaultFallback }) => {
  const leftItem = items?.[0] || fallbackItems[0]
  const rightItem = items?.[1] || fallbackItems[1]

  const leftTitle = leftItem.title || fallbackItems[0].title
  const leftImage = leftItem.desktop_image || leftItem.mobile_image || fallbackItems[0].desktop_image
  const leftLink = leftItem.button_link || fallbackItems[0].button_link
  const leftButtonText = leftItem.button_text || fallbackItems[0].button_text

  const rightTitle = rightItem.title || fallbackItems[1].title
  const rightImage = rightItem.desktop_image || rightItem.mobile_image || fallbackItems[1].desktop_image
  const rightLink = rightItem.button_link || fallbackItems[1].button_link
  const rightButtonText = rightItem.button_text || fallbackItems[1].button_text

  return (
    <section className="w-full h-[100vh] md:h-screen grid grid-cols-1 grid-rows-2 md:grid-rows-1 md:grid-cols-2 bg-neutral-900 overflow-hidden relative">
      {/* Left Column */}
      <div className="relative h-full w-full group overflow-hidden border-b md:border-b-0 md:border-r border-neutral-900 flex [&>picture]:w-full [&>picture]:h-full">
        <CloudinaryImage
          src={leftImage}
          alt={leftTitle}
          className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.02] w-full h-full"
        />

        <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10 z-20 text-white select-none flex justify-between items-center">
          <h2 className="text-sm md:text-base font-bold uppercase tracking-widest leading-none">
            {leftTitle}
          </h2>
          <LocalizedClientLink
            href={leftLink}
            className="text-white text-sm md:text-base font-bold uppercase tracking-widest hover:text-neutral-300 transition-colors duration-300 leading-none"
          >
            {leftButtonText}
          </LocalizedClientLink>
        </div>
      </div>

      {/* Right Column */}
      <div className="relative h-full w-full group overflow-hidden flex [&>picture]:w-full [&>picture]:h-full">
        <CloudinaryImage
          src={rightImage}
          alt={rightTitle}
          className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.02] w-full h-full"
        />

        <div className="absolute bottom-6 left-6 right-6 md:bottom-10 md:left-10 md:right-10 z-20 text-white select-none flex justify-between items-center">
          <h2 className="text-sm md:text-base font-bold uppercase tracking-widest leading-none">
            {rightTitle}
          </h2>
          <LocalizedClientLink
            href={rightLink}
            className="text-white text-sm md:text-base font-bold uppercase tracking-widest hover:text-neutral-300 transition-colors duration-300 leading-none"
          >
            {rightButtonText}
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

export default SplitBanner
