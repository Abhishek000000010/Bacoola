import React from "react"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface HeroBannerProps {
  title: string
  image: string
  ctaText: string
  ctaHref: string
  imagePosition?: string
}

export const HeroBanner: React.FC<HeroBannerProps> = React.memo(({
  title,
  image,
  ctaText,
  ctaHref,
  imagePosition = "center center",
}) => {
  return (
    <section className="relative w-full h-screen overflow-hidden flex flex-col justify-center items-center text-center text-white">
      <Image
        src={image}
        alt={title}
        fill
        priority
        className="object-cover"
        style={{
          objectFit: "cover",
          objectPosition: imagePosition
        }}
        sizes="100vw"
        unoptimized
      />
      <div className="absolute inset-0 bg-black/25 z-10" />
      <div className="relative z-20 max-w-4xl mx-auto px-4 flex flex-col items-center select-none animate-in fade-in duration-700">
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-[0.18em] uppercase text-white mb-8 leading-none">
          {title}
        </h1>
        <div>
          <LocalizedClientLink
            href={ctaHref}
            className="text-white text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] border-b-[1.5px] border-white pb-1.5 hover:text-neutral-300 hover:border-neutral-300 transition-colors duration-300"
          >
            {ctaText}
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
})

HeroBanner.displayName = "HeroBanner"
export default HeroBanner
