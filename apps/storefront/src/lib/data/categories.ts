import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"
import { cache } from "react"

/**
 * Field set for callers that only need to render category links.
 *
 * The default field set expands `parent_category` (and ITS parent) into full
 * nested objects, which makes every category carry copies of its ancestors:
 * 490 categories serialise to ~600KB instead of ~86KB. That cost lands on every
 * single page, because the nav hands the list to several client components
 * (HeaderLinks -> MegaMenu, SideMenu, PromoBanner) and each server->client prop
 * crossing re-serialises it into the RSC payload -- 490 categories appearing
 * ~6000 times, ~4MB of a category page's HTML.
 *
 * Nothing in the nav actually reads those nested objects: MegaMenu, SideMenu and
 * PromoBanner all rebuild the tree themselves from the scalar
 * `parent_category_id`. So ask for scalars only.
 *
 * Callers that genuinely walk `category_children` (the category template's
 * descendant-id collection, search) must NOT use this -- omit `fields` and take
 * the default.
 */
// `rank` is deliberately absent: nothing in the nav reads it, and it was 490
// numbers serialised into every page on the site. `metadata` is fetched whole
// because the store API can't select a single JSON key, but Nav strips it down
// to the one entry the promo banner reads before handing it to the client.
export const CATEGORY_LINK_FIELDS =
  "id,name,handle,parent_category_id,metadata"

export const listCategories = cache(async (query?: Record<string, unknown>) => {
  const next = {
    ...(await getCacheOptions("categories")),
    // The nav fetches this on every page render; categories change rarely, so
    // serve them from cache rather than hitting the backend each time.
    revalidate: 300,
  }

  const limit = query?.limit || 100

  return sdk.client
    .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
      "/store/product-categories",
      {
        query: {
          // Expanding *products here pulls every product of every category
          // (~1MB) on each render; nothing reading this list needs them.
          fields:
            "*category_children, *parent_category, *parent_category.parent_category",
          limit,
          ...query,
        },
        next,
      }
    )
    .then(({ product_categories }: any) => product_categories)
})

export const getCategoryByHandle = cache(async (categoryHandle: string[]) => {
  const handle = `${categoryHandle.join("/")}`

  const next = {
    ...(await getCacheOptions("categories")),
    // Category pages are `force-dynamic`, which defaults their fetches to
    // no-store. This one runs twice per page view -- generateMetadata and the
    // page body each resolve it, and React's `cache()` does not dedupe across
    // those two render passes -- so without an explicit revalidate the same
    // request was issued twice and cached neither time. Categories change
    // rarely, so reuse the 300s the nav list already uses; tag invalidation
    // still busts it immediately on an admin edit.
    revalidate: 300,
  }

  return sdk.client
    .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
      `/store/product-categories`,
      {
        query: {
          fields: "*category_children, *parent_category, *parent_category.category_children",
          include_descendants_tree: true,
          handle,
        },
        next,
      }
    )
    .then(({ product_categories }: any) => product_categories[0])
})
