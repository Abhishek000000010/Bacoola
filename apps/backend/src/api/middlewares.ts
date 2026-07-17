import {
  defineMiddlewares,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Refuses to publish a product whose variants lack shipping dimensions.
 *
 * Shiprocket will not create an order unless every item has weight AND
 * length/width/height, and Medusa's fulfillment workflow only ever reads
 * VARIANT-level values (`items.variant.*`) -- product-level dimensions are
 * loaded but never used for shipping, so setting them there does nothing.
 *
 * Without this guard the failure is invisible and expensive: the product
 * publishes, sells, the customer pays, the order looks complete, and only the
 * fulfillment silently never reaches Shiprocket.
 *
 * Deliberately gates PUBLISHING rather than saving. The admin creates a product
 * and its variants in separate requests, so rejecting every incomplete save
 * would break the normal add-product flow; drafts stay freely editable and the
 * check bites only when the product would become visible to customers.
 */

const DIMENSION_FIELDS = ["weight", "length", "width", "height"] as const

type Dimensioned = Partial<Record<(typeof DIMENSION_FIELDS)[number], unknown>>

const missingDimensions = (variant: Dimensioned): string[] =>
  DIMENSION_FIELDS.filter((field) => {
    const value = variant?.[field]
    return value === null || value === undefined || Number(value) <= 0
  })

const describe = (variant: any, index: number): string =>
  variant?.title || variant?.sku || `variant #${index + 1}`

const reject = (res: MedusaResponse, problems: string[]) =>
  res.status(400).json({
    type: "invalid_data",
    message:
      `Cannot publish: every variant needs weight, length, width and height ` +
      `before it can ship. Missing — ${problems.join("; ")}. ` +
      `Set these on each VARIANT (product-level dimensions are ignored for shipping).`,
  })

/**
 * Guards POST /admin/products and POST /admin/products/:id.
 *
 * On update the incoming body is partial, so the product's current status and
 * stored variants are consulted for anything the request does not itself carry.
 */
export async function validateProductPublish(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const body = (req.body ?? {}) as any
    const productId = (req.params as any)?.id

    let currentStatus: string | undefined
    let storedVariants: any[] = []

    if (productId) {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data } = await query.graph({
        entity: "product",
        fields: [
          "id",
          "status",
          "variants.id",
          "variants.title",
          "variants.sku",
          ...DIMENSION_FIELDS.map((f) => `variants.${f}`),
        ],
        filters: { id: productId },
      })
      currentStatus = data?.[0]?.status
      storedVariants = data?.[0]?.variants ?? []
    }

    const resultingStatus = body.status ?? currentStatus

    // Only publishing is gated. Drafts, proposals and archives pass untouched.
    if (resultingStatus !== "published") {
      return next()
    }

    // Variants named in the request win; otherwise fall back to what is stored.
    // A create request carries them inline and has nothing stored yet.
    const variants: any[] = Array.isArray(body.variants) && body.variants.length
      ? body.variants
      : storedVariants

    // A published product with no variants at all cannot be bought, but that is
    // not this guard's business -- say nothing rather than block on it.
    if (!variants.length) {
      return next()
    }

    const problems = variants
      .map((variant, index) => {
        const missing = missingDimensions(variant)
        return missing.length ? `${describe(variant, index)}: ${missing.join(", ")}` : null
      })
      .filter(Boolean) as string[]

    if (problems.length) {
      return reject(res, problems)
    }

    return next()
  } catch (err) {
    // A guard that breaks the admin is worse than one that misses an edge case;
    // fall through and let the normal request handling proceed.
    return next()
  }
}

/**
 * Guards variant create/update on an already-published product, which would
 * otherwise be a way to add an unshippable variant to a live product without
 * ever touching the product's own status.
 */
export async function validateVariantPublish(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const body = (req.body ?? {}) as any
    const productId = (req.params as any)?.id
    const variantId = (req.params as any)?.variant_id

    if (!productId) {
      return next()
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "status"],
      filters: { id: productId },
    })

    if (data?.[0]?.status !== "published") {
      return next()
    }

    let candidate: Dimensioned = body

    // An update body is partial: merge it over the stored variant so untouched
    // dimensions still count as present.
    if (variantId) {
      const { data: stored } = await query.graph({
        entity: "product_variant",
        fields: ["id", "title", "sku", ...DIMENSION_FIELDS],
        filters: { id: variantId },
      })
      candidate = { ...(stored?.[0] ?? {}), ...body }
    }

    const missing = missingDimensions(candidate)
    if (missing.length) {
      return reject(res, [`${describe(candidate, 0)}: ${missing.join(", ")}`])
    }

    return next()
  } catch (err) {
    return next()
  }
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/products",
      method: "POST",
      middlewares: [validateProductPublish],
    },
    {
      matcher: "/admin/products/:id",
      method: "POST",
      middlewares: [validateProductPublish],
    },
    {
      matcher: "/admin/products/:id/variants",
      method: "POST",
      middlewares: [validateVariantPublish],
    },
    {
      matcher: "/admin/products/:id/variants/:variant_id",
      method: "POST",
      middlewares: [validateVariantPublish],
    },
  ],
})
