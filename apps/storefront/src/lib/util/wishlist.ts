import { HttpTypes } from "@medusajs/types"

const WISHLIST_STORAGE_KEY = "bacoola_wishlist_items"

export function getWishlist(): HttpTypes.StoreProduct[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(WISHLIST_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error("Error reading wishlist from localStorage", e)
    return []
  }
}

export function isItemInWishlist(productId: string): boolean {
  if (typeof window === "undefined") return false
  const items = getWishlist()
  return items.some((item) => item.id === productId)
}

export function toggleWishlistItem(product: HttpTypes.StoreProduct): boolean {
  if (typeof window === "undefined" || !product?.id) return false
  
  const currentItems = getWishlist()
  const exists = currentItems.some((item) => item.id === product.id)
  
  let updated: HttpTypes.StoreProduct[]
  if (exists) {
    updated = currentItems.filter((item) => item.id !== product.id)
  } else {
    updated = [...currentItems, product]
  }

  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: { productId: product.id, isWishlisted: !exists } }))
  } catch (e) {
    console.error("Error updating wishlist in localStorage", e)
  }

  return !exists
}
