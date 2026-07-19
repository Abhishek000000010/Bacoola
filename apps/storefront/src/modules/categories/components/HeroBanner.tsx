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
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent z-10" />
      <div className="relative z-20 max-w-4xl mx-auto px-4 flex flex-col items-center select-none animate-in fade-in duration-700">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight uppercase text-white mb-6 leading-none">
          {title}
        </h1>
        <div>
          <LocalizedClientLink
            href={ctaHref}
            className="text-white text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] hover:text-neutral-300 transition-colors duration-300"
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
