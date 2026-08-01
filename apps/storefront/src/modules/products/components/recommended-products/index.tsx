import { getRecommendedProducts } from "@lib/data/products"
import { getVariantCards } from "@lib/util/variant-cards"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "../product-preview"
import { FadeIn } from "@modules/common/components/fade-in"

/**
 * "You may also like" strip on the product detail page.
 *
 * Shows products from the same main (non-sale) category, ordered so the ones
 * closest in price to the product being viewed come first. Each product is split
 * into one card per colourway (via getVariantCards), matching the listing pages.
 * Renders nothing when the product has no non-sale category or nothing else
 * shares it.
 */
export default async function RecommendedProducts({
  product,
  region,
  countryCode,
  selectedVariantId,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  selectedVariantId?: string
}) {
  const products = await getRecommendedProducts({
    product,
    countryCode,
    limit: 8,
    selectedVariantId,
  })

  if (!products.length) {
    return null
  }

  return (
    <section className="w-full py-8">
      <FadeIn delay={100}>
        <div className="px-5 lg:px-12 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-900">
            You may also like
          </h2>
        </div>
      </FadeIn>
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-[2px] gap-y-12">
        {products
          .flatMap((p) => getVariantCards(p).map(card => ({ p, card })))
          .map(({ p, card }, index) => (
            <FadeIn key={card.key} randomize={true}>
              <ProductPreview product={p} region={region} card={card} />
            </FadeIn>
          ))}
      </div>
    </section>
  )
}
