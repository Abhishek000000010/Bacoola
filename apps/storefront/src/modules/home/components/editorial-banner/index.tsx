import React from "react"
import CloudinaryImage from "@modules/common/components/cloudinary-image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export interface EditorialBannerProps {
  items?: any[]
}

const fallbackItem = {
  title: "The Suit Guide",
  desktop_image: "/images/campaign-5.jpg",
  button_link: "/store",
  button_text: "DISCOVER MORE"
}

export const EditorialBanner: React.FC<EditorialBannerProps> = ({ items }) => {
  const item = items?.[0] || fallbackItem

  const title = item.title || fallbackItem.title
  const image = item.desktop_image || item.mobile_image || fallbackItem.desktop_image
  const link = item.button_link || fallbackItem.button_link
  const ctaText = item.button_text || fallbackItem.button_text

  return (
    <section className="w-full h-screen relative bg-neutral-900 overflow-hidden flex flex-col justify-center items-center text-center text-white">
      <div className="absolute inset-0 w-full h-full z-0 flex [&>picture]:w-full [&>picture]:h-full">
        <CloudinaryImage
          src={image}
          alt={title}
          className="object-cover object-center w-full h-full"
        />
      </div>

      <div className="relative z-20 max-w-4xl mx-auto px-4 flex flex-col items-center select-none">
        <h2 className="text-5xl md:text-[80px] font-semibold tracking-widest uppercase mb-6 leading-none" style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}>
          {title}
        </h2>
        <div>
          <LocalizedClientLink
            href={link}
            className="text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:text-neutral-300 transition-colors duration-300"
            style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" }}
          >
            {ctaText}
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

export default EditorialBanner
