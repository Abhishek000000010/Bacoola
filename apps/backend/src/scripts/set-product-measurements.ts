import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Writes sample measurements onto one product, so the storefront MEASUREMENTS
 * panel can be verified end to end without relying on the admin widget.
 *
 * Same shape the widget writes: centimetres, keyed row -> size, on
 * `product.metadata.measurements`. Existing metadata keys are preserved.
 *
 * Run: npx medusa exec ./src/scripts/set-product-measurements.ts -- <handle>
 */

const SAMPLE = {
  unit: "cm",
  garment_type: "top",
  sizes: ["S", "M", "L", "XL", "XXL"],
  article: {
    length: { S: 67.5, M: 69, L: 71, XL: 73, XXL: 74.5 },
    back: { S: 42, M: 44, L: 46, XL: 48, XXL: 49 },
    chest: { S: 52, M: 54, L: 57, XL: 60, XXL: 62 },
    sleeve_width: { S: 17.3, M: 18, L: 18.8, XL: 19.6, XXL: 20.1 },
    sleeve_length: { S: 24, M: 24.5, L: 25.5, XL: 26.5, XXL: 27 },
  },
  body: {
    bust: { S: 96, M: 102, L: 110.5, XL: 116, XXL: 120 },
    waist: { S: 80, M: 86, L: 90, XL: 96, XXL: 100 },
  },
}

export default async function setProductMeasurements({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const handle = process.argv[process.argv.length - 1]
  if (!handle || handle.endsWith(".ts")) {
    logger.error("Pass a product handle: -- <handle>")
    return
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "metadata"],
    filters: { handle },
  })

  const product = products?.[0]
  if (!product) {
    logger.error(`No product with handle "${handle}"`)
    return
  }

  await updateProductsWorkflow(container).run({
    input: {
      selector: { id: product.id },
      update: {
        metadata: {
          ...(product.metadata ?? {}),
          measurements: SAMPLE,
        },
      },
    },
  })

  const { data: after } = await query.graph({
    entity: "product",
    fields: ["id", "metadata"],
    filters: { id: product.id },
  })

  logger.info(
    `Wrote measurements to ${product.title} (${handle}). measurements present: ${!!(
      after?.[0]?.metadata as any
    )?.measurements}`
  )
}
