"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { clx } from "@medusajs/ui"

export default function GridToggle({ currentGrid = "4" }: { currentGrid?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setGrid = useCallback(
    (gridCols: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("grid", gridCols)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams]
  )

  return (
    <div className="flex gap-x-3 items-center">
      {/* 2 columns (single box) */}
      <button
        onClick={() => setGrid("2")}
        className={clx(
          "p-1.5 focus:outline-none flex flex-col items-center transition-colors duration-200",
          currentGrid === "2" ? "text-black" : "text-neutral-400 hover:text-neutral-600"
        )}
        aria-label="2 Columns Layout"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="1" y="1" width="16" height="16" />
        </svg>
        <div className={clx("w-[22px] h-[1.5px] mt-[6px]", currentGrid === "2" ? "bg-black" : "bg-transparent")} />
      </button>

      {/* 4 columns (box split in two) */}
      <button
        onClick={() => setGrid("4")}
        className={clx(
          "p-1.5 focus:outline-none flex flex-col items-center transition-colors duration-200",
          currentGrid === "4" ? "text-black" : "text-neutral-400 hover:text-neutral-600"
        )}
        aria-label="4 Columns Layout"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="1" y="1" width="16" height="16" />
          <line x1="9" y1="1" x2="9" y2="17" />
        </svg>
        <div className={clx("w-[22px] h-[1.5px] mt-[6px]", currentGrid === "4" ? "bg-black" : "bg-transparent")} />
      </button>

      {/* 6 columns (box split in four) */}
      <button
        onClick={() => setGrid("6")}
        className={clx(
          "p-1.5 focus:outline-none flex flex-col items-center transition-colors duration-200",
          currentGrid === "6" ? "text-black" : "text-neutral-400 hover:text-neutral-600"
        )}
        aria-label="6 Columns Layout"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="1" y="1" width="16" height="16" />
          <line x1="9" y1="1" x2="9" y2="17" />
          <line x1="1" y1="9" x2="17" y2="9" />
        </svg>
        <div className={clx("w-[22px] h-[1.5px] mt-[6px]", currentGrid === "6" ? "bg-black" : "bg-transparent")} />
      </button>
    </div>
  )
}
