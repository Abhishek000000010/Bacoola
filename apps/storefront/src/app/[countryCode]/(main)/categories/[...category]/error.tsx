"use client"

import { useEffect } from "react"

export default function CategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full px-4 text-center">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-950 mb-4">
        Something went wrong
      </h3>
      <p className="text-sm text-neutral-500 max-w-md mb-8">
        Unable to load products. Please refresh the page or try again later.
      </p>
      <button
        onClick={() => reset()}
        className="px-8 py-3 bg-neutral-950 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
