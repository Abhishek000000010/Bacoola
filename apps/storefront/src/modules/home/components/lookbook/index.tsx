"use client"

import React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const GALLERY_IMAGES = [
  { src: "/images/lookbook-1.jpg", alt: "Lookbook summer style 1" },
  { src: "/images/lookbook-2.jpg", alt: "Lookbook summer style 2" },
  { src: "/images/lookbook-3.jpg", alt: "Lookbook summer style 3" },
  { src: "/images/lookbook-4.jpg", alt: "Lookbook summer style 4" },
  { src: "/images/lookbook-5.jpg", alt: "Lookbook summer style 5" },
  { src: "/images/lookbook-6.jpg", alt: "Lookbook summer style 6" },
  { src: "/images/lookbook-7.jpg", alt: "Lookbook summer style 7" },
  { src: "/images/lookbook-8.jpg", alt: "Lookbook summer style 8" },
]

export const LookbookGallery: React.FC = () => {
  return (
    <section className="w-full py-12 md:py-24 px-4 sm:px-6 lg:px-8 max-w-[1550px] mx-auto bg-white">
      {/* Title */}
      <div className="flex flex-col items-center mb-12 text-center">
        <h2 className="text-xs font-semibold tracking-[0.4em] uppercase text-neutral-400 mb-2">Editorial lookbook</h2>
        <p className="text-xl sm:text-2xl font-light uppercase tracking-widest text-[#111111]">Shop the look</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {GALLERY_IMAGES.map(({ src, alt }, idx) => (
          <motion.div
            key={src}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: (idx % 4) * 0.1 }}
            className="relative aspect-[3/4] overflow-hidden group cursor-pointer"
          >
            <LocalizedClientLink href="/store">
              {/* Image */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={src}
                  alt={alt}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                {/* Hover overlay */}

              </div>

              {/* Hover text label */}
              <div className="absolute inset-0 z-20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] border border-white px-4 py-2 hover:bg-white hover:text-black transition-all duration-300">
                  Shop the Look
                </span>
              </div>
            </LocalizedClientLink>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default LookbookGallery
