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

/**
 * A variant with no price cannot be sold: Medusa refuses to add it to a cart,
 * so the storefront shows a price-shaped blank and an add button that only
 * fails once clicked. Publishing one is never intentional.
 */
const hasNoPrice = (variant: any): boolean =>
  !Array.isArray(variant?.prices) || variant.prices.length === 0

const describe = (variant: any, index: number): string =>
  variant?.title || variant?.sku || `variant #${index + 1}`

const reject = (res: MedusaResponse, problems: string[]) =>
  res.status(400).json({
    type: "invalid_data",
    message:
      `Cannot publish: ${problems.join("; ")}. ` +
      `Every variant needs a price, plus weight/length/width/height to ship. ` +
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
    let storedProfileId: string | undefined

    if (productId) {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data } = await query.graph({
        entity: "product",
        fields: [
          "id",
          "status",
          "shipping_profile.id",
          "variants.id",
          "variants.title",
          "variants.sku",
          "variants.prices.*",
          ...DIMENSION_FIELDS.map((f) => `variants.${f}`),
        ],
        filters: { id: productId },
      })
      currentStatus = data?.[0]?.status
      storedVariants = data?.[0]?.variants ?? []
      storedProfileId = data?.[0]?.shipping_profile?.id
    }

    const resultingStatus = body.status ?? currentStatus

    // Only publishing is gated. Drafts, proposals and archives pass untouched.
    if (resultingStatus !== "published") {
      return next()
    }

    // A product with no shipping profile cannot be checked out at all: the
    // cart's validate-shipping step matches each item's profile against the
    // chosen shipping method, an absent one never matches, and completion
    // throws. The customer pays, no order is created, and nothing reaches
    // Shiprocket -- so the money is taken with no record to reconcile it
    // against. Publishing is the last point where this is still cheap to catch.
    const resultingProfileId =
      body.shipping_profile_id !== undefined
        ? body.shipping_profile_id
        : storedProfileId

    if (!resultingProfileId) {
      return res.status(400).json({
        type: "invalid_data",
        message:
          `Cannot publish: this product has no shipping profile. ` +
          `Without one the cart cannot be completed -- the customer's payment goes through ` +
          `but no order is ever created. Select a shipping profile on the product first.`,
      })
    }

    // Variants named in the request win; otherwise fall back to what is stored.
    // A create request carries them inline and has nothing stored yet.
    // Merge by id on update: a partial body (e.g. dimensions only) would
    // otherwise look priceless even when prices are already stored.
    const bodyVariants: any[] = Array.isArray(body.variants) ? body.variants : []
    const variants: any[] = bodyVariants.length
      ? bodyVariants.map((v) => {
          const stored = storedVariants.find((s: any) => s.id && s.id === v.id)
          return stored ? { ...stored, ...v } : v
        })
      : storedVariants

    // A product with no variants cannot be bought either.
    if (!variants.length) {
      return reject(res, ["a product needs at least one variant"])
    }

    const problems = variants
      .map((variant, index) => {
        const faults: string[] = []
        if (hasNoPrice(variant)) {
          faults.push("no price")
        }
        const missing = missingDimensions(variant)
        if (missing.length) {
          faults.push(`missing ${missing.join(", ")}`)
        }
        return faults.length ? `${describe(variant, index)}: ${faults.join(" and ")}` : null
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

/**
 * Requires every new product to define a Size option.
 *
 * Products created without one render no size picker on the storefront, so the
 * customer has nothing to choose and the listing's size bar falls back to a
 * hardcoded XS-XL strip that does not reflect what is actually sellable.
 *
 * Enforced on CREATE only. Options are part of the create payload, so this is
 * the one moment the whole set is visible in a single request; policing later
 * edits would block ordinary changes to products that predate the rule.
 */
const SIZE_OPTION = /^sizes?$/i

export async function validateSizeOption(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const body = (req.body ?? {}) as any
    const options: any[] = Array.isArray(body.options) ? body.options : []

    const sizeOption = options.find((o) => SIZE_OPTION.test((o?.title ?? "").trim()))

    const values: any[] = Array.isArray(sizeOption?.values) ? sizeOption.values : []

    if (!sizeOption || !values.length) {
      return res.status(400).json({
        type: "invalid_data",
        message:
          `Cannot create product: a "Size" option with at least one value is required. ` +
          `Without it the storefront has no size picker to show. ` +
          `Add an option titled "Size" (e.g. S, M, L, XL) before saving.`,
      })
    }

    return next()
  } catch (err) {
    return next()
  }
}

/**
 * Root categories that represent a shop section. A product belongs to exactly
 * one of them.
 */
const ROOT_SECTIONS = ["women", "men", "teen", "kids"]

/**
 * Refuses to link a product into more than one root section.
 *
 * A product in two sections is listed under both, so a women's product shows up
 * on a men's sale page with a men's discount on it. This is invisible in the
 * admin -- each individual category assignment looks reasonable on its own --
 * and only surfaces as a customer clicking a men's sale tile and landing on a
 * women's product page. Categories *within* one section stay unrestricted, so
 * the normal "Clothing > T-shirts" plus "Sale" pairing still works.
 */
async function sectionsOf(req: MedusaRequest, categoryIds: string[]): Promise<Map<string, string>> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "parent_category_id"],
  })

  const byId = new Map<string, any>(categories.map((c: any) => [c.id, c]))
  const sections = new Map<string, string>()

  for (const id of categoryIds) {
    let current = byId.get(id)
    let guard = 0
    while (current?.parent_category_id && guard++ < 10) {
      current = byId.get(current.parent_category_id)
    }
    if (current?.handle) {
      sections.set(id, current.handle)
    }
  }

  return sections
}

const rejectMultiSection = (res: MedusaResponse, found: string[], detail: string) =>
  res.status(400).json({
    type: "invalid_data",
    message:
      `Cannot save: this product would belong to ${found.length} sections (${found.join(", ")}). ` +
      `A product must live in a single section. ${detail}`,
  })

export async function validateSingleSection(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const body = (req.body ?? {}) as any
    const productId = (req.params as any)?.id

    // The admin sends either shape depending on the screen used.
    const incoming: string[] = Array.isArray(body.category_ids)
      ? body.category_ids
      : Array.isArray(body.categories)
      ? body.categories.map((c: any) => c?.id ?? c).filter(Boolean)
      : []

    // Requests that do not touch categories are none of this guard's business.
    if (!incoming.length) {
      return next()
    }

    const sections = await sectionsOf(req, incoming)
    const found = [...new Set([...sections.values()])].filter((s) =>
      ROOT_SECTIONS.includes(s)
    )

    if (found.length > 1) {
      return rejectMultiSection(
        res,
        found,
        `Remove the categories that do not belong to the section this product is sold in.`
      )
    }

    return next()
  } catch (err) {
    return next()
  }
}

/**
 * Guards the other direction: adding products to a category from the category's
 * own screen, which never touches the product update route above.
 */
export async function validateCategoryProducts(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const body = (req.body ?? {}) as any
    const categoryId = (req.params as any)?.id
    const add: string[] = Array.isArray(body.add) ? body.add : []

    if (!categoryId || !add.length) {
      return next()
    }

    const targetSection = (await sectionsOf(req, [categoryId])).get(categoryId)
    if (!targetSection || !ROOT_SECTIONS.includes(targetSection)) {
      return next()
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "categories.id"],
      filters: { id: add },
    })

    const conflicts: string[] = []

    for (const product of products as any[]) {
      const existing = (product.categories ?? []).map((c: any) => c.id)
      if (!existing.length) continue

      const sections = await sectionsOf(req, existing)
      const found = [...new Set([...sections.values()])].filter((s) =>
        ROOT_SECTIONS.includes(s) && s !== targetSection
      )

      if (found.length) {
        conflicts.push(`${product.handle} (already in ${found.join(", ")})`)
      }
    }

    if (conflicts.length) {
      return rejectMultiSection(
        res,
        [targetSection, "another section"],
        `Conflicting products: ${conflicts.join("; ")}.`
      )
    }

    return next()
  } catch (err) {
    return next()
  }
}

/**
 * Refuses to delete a product's last variant.
 *
 * A product with no variants cannot be priced, added to a cart, or published --
 * it is simply broken, and the admin offers no way back except recreating the
 * variant. Deleting variants one by one makes this easy to walk into, so the
 * rule lives here rather than only in the bulk-delete widget.
 */
export async function validateVariantDelete(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    const productId = (req.params as any)?.id

    if (!productId) {
      return next()
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "variants.id"],
      filters: { id: productId },
    })

    const variantCount = data?.[0]?.variants?.length ?? 0

    if (variantCount <= 1) {
      return res.status(400).json({
        type: "not_allowed",
        message:
          `Cannot delete the last variant: a product needs at least one variant ` +
          `to be priced, sold, or published. Add another variant first, or delete the product itself.`,
      })
    }

    return next()
  } catch (err) {
    return next()
  }
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/products/:id/variants/:variant_id",
      method: "DELETE",
      middlewares: [validateVariantDelete],
    },
    {
      matcher: "/admin/products",
      method: "POST",
      middlewares: [validateSizeOption, validateProductPublish, validateSingleSection],
    },
    {
      matcher: "/admin/products/:id",
      method: "POST",
      middlewares: [validateProductPublish, validateSingleSection],
    },
    {
      matcher: "/admin/product-categories/:id/products",
      method: "POST",
      middlewares: [validateCategoryProducts],
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
