"use client"

import React from "react"
import { motion } from "framer-motion"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const BrandStory: React.FC = () => {
  return (
    <section className="w-full py-24 md:py-36 px-4 bg-white text-center flex flex-col items-center justify-center">
      <div className="max-w-3xl mx-auto flex flex-col items-center">
        {/* Editorial Subtitle */}
        <motion.span
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-xs lg:text-sm font-semibold tracking-[0.4em] uppercase text-neutral-400 mb-6"
        >
          Our Philosophy
        </motion.span>

        {/* Core Timeless Statement */}
        <motion.h2
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-2xl sm:text-3xl md:text-4xl font-extralight tracking-widest text-[#111111] leading-relaxed uppercase mb-10"
        >
          Designed with timeless elegance.
          <br className="hidden sm:inline" /> Crafted using premium materials.
          <br className="hidden sm:inline" /> Made for modern lifestyles.
        </motion.h2>

        {/* Minimal Underlined Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <LocalizedClientLink
            href="/store"
            className="text-[12px] lg:text-[14px] sm:text-xs lg:text-sm font-semibold uppercase tracking-[0.3em] text-[#111111] border-b-[1.5px] border-black pb-1 hover:text-neutral-500 hover:border-neutral-400 transition-colors duration-300"
          >
            Learn More
          </LocalizedClientLink>
        </motion.div>
      </div>
    </section>
  )
}

export default BrandStory
