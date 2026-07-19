import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getRegion } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"


export const metadata: Metadata = {
  title: "Cart",
  description: "View your cart",
}

export default async function Cart(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()
  const region = await getRegion(countryCode)
  
  let products: HttpTypes.StoreProduct[] = []
  if (region) {
    try {
      const res = await listProducts({
        regionId: region.id,
        countryCode,
        queryParams: {
          limit: 8,
          fields: "*variants.calculated_price",
        },
      })
      products = res.response.products
    } catch (error) {
      console.error("Failed to load recommended products:", error)
    }
  }

  return (
    <CartTemplate
      cart={cart}
      customer={customer}
      region={region || null}
      products={products}
    />
  )
}

