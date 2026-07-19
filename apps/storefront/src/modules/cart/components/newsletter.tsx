"use client"

import React, { useState } from "react"

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // UI-only logic
    alert(`Subscribed: ${email}`)
    setEmail("")
  }

  return (
    <div className="w-full bg-[#FAFAFA] border-t border-b border-neutral-100 py-16 px-4">
      <div className="max-w-[600px] mx-auto text-center flex flex-col items-center">
        <h3 className="text-base sm:text-lg font-light tracking-widest text-[#111111] uppercase mb-8">
          10% off your next purchase by subscribing to the newsletter
        </h3>

        <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            required
            className="flex-1 bg-white border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:border-black tracking-wide"
          />
          <button
            type="submit"
            className="border border-black bg-white hover:bg-black hover:text-white text-black text-xs font-semibold tracking-widest uppercase px-8 py-3.5 transition-all duration-300 shrink-0"
          >
            Sign Up Now
          </button>
        </form>

        <p className="text-[11px] text-neutral-500 font-light leading-relaxed">
          By subscribing, you confirm that you have read the{" "}
          <a href="#" className="underline hover:text-black transition-colors font-normal">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  )
}

export default Newsletter
