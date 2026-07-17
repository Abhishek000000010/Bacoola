import React from "react"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface EditorialGridProps {
  leftTitle: string
  leftImage: string
  leftHref: string
  leftSpan: string
  rightTitle: string
  rightImage: string
  rightHref: string
  rightSpan: string
  leftImagePosition?: string
  rightImagePosition?: string
}

export const EditorialGrid: React.FC<EditorialGridProps> = React.memo(({
  leftTitle,
  leftImage,
  leftHref,
  leftSpan,
  rightTitle,
  rightImage,
  rightHref,
  rightSpan,
  leftImagePosition = "center center",
  rightImagePosition = "center center",
}) => {
  return (
    <section className="w-full h-screen grid grid-cols-1 md:grid-cols-5 bg-neutral-900 overflow-hidden relative">
      {/* Left Card */}
      <div className={`relative h-full w-full group overflow-hidden border-b md:border-b-0 md:border-r border-neutral-900 ${leftSpan}`}>
        <Image
          src={leftImage}
          alt={leftTitle}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          style={{
            objectFit: "cover",
            objectPosition: leftImagePosition
          }}
          sizes="(max-width: 768px) 100vw, 60vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/20 z-10" />
        <div className="absolute bottom-12 left-12 z-20 text-white select-none">
          <h2 className="text-3xl font-light uppercase tracking-[0.15em] mb-4 leading-none">
            {leftTitle}
          </h2>
          <div>
            <LocalizedClientLink
              href={leftHref}
              className="text-white text-xs uppercase tracking-[0.25em] border-b border-white pb-1 hover:text-neutral-300 hover:border-neutral-300 transition-all duration-300"
            >
              SEE ALL →
            </LocalizedClientLink>
          </div>
        </div>
      </div>

      {/* Right Card */}
      <div className={`relative h-full w-full group overflow-hidden ${rightSpan}`}>
        <Image
          src={rightImage}
          alt={rightTitle}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          style={{
            objectFit: "cover",
            objectPosition: rightImagePosition
          }}
          sizes="(max-width: 768px) 100vw, 60vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/20 z-10" />
        <div className="absolute bottom-12 left-12 z-20 text-white select-none">
          <h2 className="text-3xl font-light uppercase tracking-[0.15em] mb-4 leading-none">
            {rightTitle}
          </h2>
          <div>
            <LocalizedClientLink
              href={rightHref}
              className="text-white text-xs uppercase tracking-[0.25em] border-b border-white pb-1 hover:text-neutral-300 hover:border-neutral-300 transition-all duration-300"
            >
              SEE ALL →
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
})

EditorialGrid.displayName = "EditorialGrid"
export default EditorialGrid
