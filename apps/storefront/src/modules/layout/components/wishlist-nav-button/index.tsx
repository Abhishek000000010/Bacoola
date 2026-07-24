"use client"

import React, { useState, useEffect } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getWishlist } from "@lib/util/wishlist"

export default function WishlistNavButton() {
  const [count, setCount] = useState(0)

  const updateCount = () => {
    setCount(getWishlist().length)
  }

  useEffect(() => {
    updateCount()

    const handleWishlistUpdate = () => {
      updateCount()
    }

    window.addEventListener("wishlist-updated", handleWishlistUpdate)
    return () => {
      window.removeEventListener("wishlist-updated", handleWishlistUpdate)
    }
  }, [])

  return (
    <LocalizedClientLink
      href="/wishlist"
      className="hover:text-[#555555] transition-colors duration-200 uppercase font-semibold text-[14px]"
    >
      Wishlist {count > 0 ? `(${count})` : "(0)"}
    </LocalizedClientLink>
  )
}
