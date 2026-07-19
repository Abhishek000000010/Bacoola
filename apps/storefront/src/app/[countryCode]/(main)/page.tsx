import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import EditorialFlow from "@modules/home/components/editorial-flow"
import FeaturedProductsShowcase from "@modules/home/components/featured-products/showcase"

import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"

export const metadata: Metadata = {
  title: "Bacoola Store | Modern Essentials & Luxury Couture",
  description:
    "Discover timeless fashion essentials crafted for modern living and everyday luxury. Shop our new Summer Collection.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections || !region) {
    return null
  }

  // Retrieve priced products from Medusa backend for featured showcase
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      limit: 8,
      fields: "*variants.calculated_price",
    },
  })

  return (
    <>
      {/* 1. Cinematic Hero Slider */}
      <Hero />

      {/* 2. Magazine-like Editorial Campaign Flow */}
      <EditorialFlow />
    </>
  )
}


