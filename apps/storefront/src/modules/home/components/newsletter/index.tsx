"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail("")
    }
  }

  return (
    <section className="w-full py-24 md:py-32 bg-white text-center flex flex-col items-center justify-center border-t border-neutral-100">
      <div className="max-w-xl mx-auto px-4 flex flex-col items-center">
        
        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-2xl sm:text-3xl font-light uppercase tracking-[0.25em] text-[#111111] mb-4"
        >
          Stay Inspired
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xs sm:text-sm font-light text-neutral-500 tracking-wide mb-8 max-w-md leading-relaxed"
        >
          Be the first to discover new collections, exclusive launches, and seasonal edits.
        </motion.p>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full"
        >
          {subscribed ? (
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600 transition-all duration-300">
              Thank you for subscribing.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-4 w-full">
              <input
                type="email"
                placeholder="ENTER YOUR EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-b border-neutral-300 py-3 text-xs tracking-widest text-[#111111] placeholder-neutral-400 focus:outline-none focus:border-black transition-colors bg-transparent rounded-none"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 border border-black bg-black text-white text-xs font-semibold uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-colors rounded-none whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}

export default Newsletter
