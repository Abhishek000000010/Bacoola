"use client"

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react"
import { useParams } from "next/navigation"
import { addToCart } from "@lib/data/cart"

type DeletedItem = {
  variantId: string
  quantity: number
}

type CartUndoContextValue = {
  notifyDeleted: (item: DeletedItem) => void
}

const CartUndoContext = createContext<CartUndoContextValue | null>(null)

// Item unmounts the moment it is removed from the cart, so the "item deleted"
// toast can't live inside it. This provider wraps the cart, keeps the toast
// state, and offers `notifyDeleted` for the row to call on its way out.
export const useCartUndo = () => useContext(CartUndoContext)

const AUTO_DISMISS_MS = 6000

const CartUndoProvider = ({ children }: { children: React.ReactNode }) => {
  const params = useParams()
  const countryCode = (params?.countryCode as string) || ""

  const [deleted, setDeleted] = useState<DeletedItem | null>(null)
  const [restoring, setRestoring] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const notifyDeleted = useCallback((item: DeletedItem) => {
    setDeleted(item)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => setDeleted(null), AUTO_DISMISS_MS)
  }, [])

  const handleUndo = async () => {
    if (!deleted || restoring) {
      return
    }
    setRestoring(true)
    try {
      await addToCart({
        variantId: deleted.variantId,
        quantity: deleted.quantity,
        countryCode,
      })
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      setDeleted(null)
    } finally {
      setRestoring(false)
    }
  }

  return (
    <CartUndoContext.Provider value={{ notifyDeleted }}>
      {children}
      {deleted && (
        <div className="fixed top-24 right-4 lg:right-12 z-50 flex items-stretch shadow-lg">
          <div className="bg-black text-white text-[12px] lg:text-[14px] font-semibold uppercase tracking-widest px-6 py-4 flex items-center">
            Item deleted
          </div>
          <button
            type="button"
            onClick={handleUndo}
            disabled={restoring}
            className="bg-neutral-100 text-black text-[12px] lg:text-[14px] font-semibold uppercase tracking-widest px-6 py-4 hover:bg-neutral-200 transition-colors disabled:opacity-60"
          >
            {restoring ? "..." : "Undo"}
          </button>
        </div>
      )}
    </CartUndoContext.Provider>
  )
}

export default CartUndoProvider
