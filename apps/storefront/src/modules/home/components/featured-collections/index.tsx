"use client"

import React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const COLLECTIONS = [
  { name: "Men", img: "/images/campaign-2.jpg", link: "/categories/men" },
  { name: "Women", img: "/images/campaign-1.jpg", link: "/categories/women" },
  { name: "Accessories", img: "/images/campaign-8.jpg", link: "/store" },
  { name: "New Arrivals", img: "/images/campaign-7.jpg", link: "/store" },
]

export const FeaturedCollections: React.FC = () => {
  return (
    <section className="w-full py-12 md:py-24 px-4 sm:px-6 lg:px-8 max-w-[1550px] mx-auto bg-white">
      {/* Editorial Title */}
      <div className="flex flex-col items-center mb-12 md:mb-16 text-center">
        <h2 className="text-xs font-semibold tracking-[0.4em] uppercase text-neutral-400 mb-2">Shop by category</h2>
        <p className="text-xl sm:text-2xl font-light uppercase tracking-widest text-[#111111]">Featured Collections</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {COLLECTIONS.map(({ name, img, link }, idx) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="relative aspect-[3/4] overflow-hidden group cursor-pointer"
          >
            <LocalizedClientLink href={link}>
              {/* Image with zoom scale on hover */}
              <div className="absolute inset-0 z-0">
                <Image
                  src={img}
                  alt={`${name} collection`}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                {/* Overlay that darkens slightly on hover */}

              </div>

              {/* Centered label */}
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center p-4">
                <h3 className="text-xl sm:text-2xl font-light uppercase tracking-[0.2em] mb-4">
                  {name}
                </h3>
                
                {/* CTA that fades and slides up on hover */}
                <span className="text-[10px] font-semibold uppercase tracking-[0.25em] border-b border-white pb-1 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out">
                  Shop Now
                </span>
              </div>
            </LocalizedClientLink>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default FeaturedCollections
