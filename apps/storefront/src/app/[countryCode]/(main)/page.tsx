import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import EditorialFlow from "@modules/home/components/editorial-flow"
import FeaturedProductsShowcase from "@modules/home/components/featured-products/showcase"

import { listCollections } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"

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

  const [region, { collections }] = await Promise.all([
    getRegion(countryCode),
    listCollections({
      fields: "id, handle, title",
    }),
  ])

  if (!collections || !region) {
    return null
  }

  // Removed unused priced products retrieval

  return (
    <>
      {/* 1. Cinematic Hero Slider */}
      <Hero />

      {/* 2. Magazine-like Editorial Campaign Flow */}
      <EditorialFlow />
    </>
  )
}


