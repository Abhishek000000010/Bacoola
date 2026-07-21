"use client"

import { useRouter } from "next/navigation"
import { useState, Suspense } from "react"
export default function SearchTemplate({ countryCode, query, children }: { countryCode: string, query?: string, children?: React.ReactNode }) {
  const router = useRouter()
  const [q, setQ] = useState(query || "")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) {
      router.push(`/${countryCode}/search?q=${encodeURIComponent(q.trim())}`)
    } else {
      router.push(`/${countryCode}/search`)
    }
  }

  return (
    <div className="w-full py-12 px-4 md:px-8 max-w-7xl mx-auto min-h-[60vh]">
      <h1 className="text-2xl md:text-3xl font-bold mb-8 uppercase text-center tracking-widest text-[#111111]">Search Store</h1>
      
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-16 flex items-center border-b-2 border-black pb-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 mr-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input 
          type="text" 
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for shirts, suits, etc..." 
          className="w-full py-2 outline-none bg-transparent text-lg md:text-xl placeholder:text-gray-400"
          autoFocus
        />
        <button type="submit" className="px-4 font-bold uppercase tracking-wider hover:text-gray-500 text-sm md:text-base">
          Search
        </button>
      </form>

      {children}
    </div>
  )
}
