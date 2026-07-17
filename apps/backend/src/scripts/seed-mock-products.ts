import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { createProductsWorkflow, createInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"

function generateMockProducts(category: any, count: number, salesChannelId: string, shippingProfileId: string) {
  const sizes = ["S", "M", "L", "XL"]
  const colors = ["Black", "White", "Navy", "Beige"]
  const products = []

  for (let i = 1; i <= count; i++) {
    const title = `${category.name} - Essential Collection ${i}`
    const handle = `${category.handle}-essential-${i}`
    
    // Generate variants
    const variants = sizes.flatMap(size => 
      colors.map(color => ({
        title: `${size} / ${color}`,
        sku: `${handle}-${size}-${color}`.toUpperCase(),
        options: { Size: size, Color: color },
        weight: 400,
        length: 30,
        width: 25,
        height: 4,
        prices: [
          { amount: Math.floor(Math.random() * (4999 - 999 + 1) + 999), currency_code: "inr" },
          { amount: Math.floor(Math.random() * (99 - 19 + 1) + 19), currency_code: "usd" }
        ]
      }))
    )

    products.push({
      title,
      handle,
      description: `Premium quality ${category.name.toLowerCase()} designed for everyday comfort and style. Part of our exclusive essential collection.`,
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      category_ids: [category.id],
      images: [
        { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png" }
      ],
      options: [
        { title: "Size", values: sizes },
        { title: "Color", values: colors }
      ],
      variants,
      sales_channels: [{ id: salesChannelId }]
    })
  }

  return products
}

export default async function seedMockProducts({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("Fetching setup data...")
  const { data: salesChannels } = await query.graph({ entity: "sales_channel", fields: ["id"] })
  const { data: shippingProfiles } = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  const { data: stockLocations } = await query.graph({ entity: "stock_location", fields: ["id"] })
  const { data: allCategories } = await query.graph({ entity: "product_category", fields: ["id", "name", "handle", "category_children.*"] })

  const salesChannelId = salesChannels[0]?.id
  const shippingProfileId = shippingProfiles[0]?.id
  const stockLocationId = stockLocations[0]?.id

  if (!salesChannelId || !shippingProfileId || !stockLocationId) {
    logger.error("Missing required setup data (sales channel, shipping profile, or stock location).")
    return
  }

  // Find leaf categories (categories with no children) and specifically target Women's Clothing categories
  const leafCategories = allCategories.filter(cat => 
    (!cat.category_children || cat.category_children.length === 0) && 
    (cat.handle.includes('women') || cat.handle.includes('wc-v2'))
  )
  logger.info(`Found ${leafCategories.length} leaf categories for women. Generating 10 products for each...`)

  let allProducts = []
  for (const category of leafCategories) {
    allProducts.push(...generateMockProducts(category, 10, salesChannelId, shippingProfileId))
  }

  logger.info(`Total products to create: ${allProducts.length}. Creating in batches of 50 to avoid timeout...`)

  const BATCH_SIZE = 50
  for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
    const batch = allProducts.slice(i, i + BATCH_SIZE)
    logger.info(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(allProducts.length/BATCH_SIZE)}...`)
    
    try {
      await createProductsWorkflow(container).run({
        input: { products: batch }
      })
    } catch (e) {
      logger.error(`Error in batch ${Math.floor(i/BATCH_SIZE) + 1}: ${e.message}`)
    }
  }

  logger.info("Setting inventory levels for all new products...")
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })

  // We batch inventory levels too
  const inventoryLevels = inventoryItems.map((item) => ({
    location_id: stockLocationId,
    stocked_quantity: 100,
    inventory_item_id: item.id,
  }))

  const INV_BATCH_SIZE = 1000
  for (let i = 0; i < inventoryLevels.length; i += INV_BATCH_SIZE) {
    const batch = inventoryLevels.slice(i, i + INV_BATCH_SIZE)
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: batch }
    })
  }

  logger.info("Finished seeding mock products!")
}
