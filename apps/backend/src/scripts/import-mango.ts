import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { createProductsWorkflow, createInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"
import fs from "fs"
import csv from "csv-parser"

export default async function importMango({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("Fetching setup data...")
  const { data: salesChannels } = await query.graph({ entity: "sales_channel", fields: ["id"] })
  const { data: shippingProfiles } = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  const { data: stockLocations } = await query.graph({ entity: "stock_location", fields: ["id"] })
  const { data: allCategories } = await query.graph({ entity: "product_category", fields: ["id", "name", "handle", "parent_category_id"] })

  const salesChannelId = salesChannels[0]?.id
  const shippingProfileId = shippingProfiles[0]?.id
  const stockLocationId = stockLocations[0]?.id

  if (!salesChannelId || !shippingProfileId || !stockLocationId) {
    logger.error("Missing required setup data (sales channel, shipping profile, or stock location).")
    return
  }

  // Find the category "Men -> Clothing -> T-Shirts"
  // Let's look for a category with name "T-Shirts" or "T-shirts" which has a parent "Clothing" which has a parent "Men"
  // If not exactly matching, just find one containing 't-shirt' or 'tshirt' in handle
  let targetCategory = allCategories.find(c => c.handle.includes("t-shirt") || c.handle.includes("tshirt"))
  if (!targetCategory) {
    logger.warn("Could not find a T-Shirts category. Will look for 'Men' category.")
    targetCategory = allCategories.find(c => c.handle.includes("men"))
  }
  if (!targetCategory) {
    logger.warn("Could not find 'Men' category. Defaulting to first category.")
    targetCategory = allCategories[0]
  }

  logger.info(`Target category selected: ${targetCategory.name} (${targetCategory.handle})`)

  logger.info("Parsing CSV...")
  
  const results: any[] = []
  await new Promise((resolve, reject) => {
    fs.createReadStream('c:/Projects/bacoola-2/shop.csv')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  logger.info(`Successfully parsed ${results.length} rows from CSV. Transforming...`)

  const productsToCreate: any[] = []
  
  const generateHandle = (title: string, index: number) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + "-" + index;
  };
  
  let prodIndex = 1;
  
  for (const row of results) {
      const title = row['ProductTitle-module__7eNKla__productTitle'];
      let priceStr = row['SinglePrice-module__y_asRG__center'];
      
      if (!priceStr) {
          priceStr = row['SinglePrice-module__y_asRG__crossed'];
      }
      
      const thumbnail = row['ProductMedia-module__xopx3q__mediaWrapper src'];
      
      if (!title || !priceStr) continue;
      
      const priceClean = priceStr.replace(/[^0-9]/g, '');
      const price = parseInt(priceClean, 10) / 100; // Because it includes .00 usually
      
      const img1 = row['ProductMedia-module__xopx3q__mediaWrapper src 2'] || '';
      const img2 = row['ProductMedia-module__xopx3q__mediaWrapper src 3'] || '';
      const img3 = row['ProductMedia-module__xopx3q__mediaWrapper src 4'] || '';
      
      // Extract sizes
      const sizes: string[] = [];
      const sizeCols = [
          'SizePicker-module__WzYwuW__sizePickerAddToBagButton',
          'SizePicker-module__WzYwuW__sizePickerAddToBagButton 2',
          'SizePicker-module__WzYwuW__sizePickerAddToBagButton 3',
          'SizePicker-module__WzYwuW__sizePickerAddToBagButton 4',
          'SizePicker-module__WzYwuW__sizePickerAddToBagButton 5',
          'SizePicker-module__WzYwuW__sizePickerAddToBagButton 6'
      ];
      
      for (const col of sizeCols) {
          if (row[col] && row[col].trim() !== '') {
              sizes.push(row[col].trim());
          }
      }
      
      if (sizes.length === 0) {
          sizes.push('One Size');
      }
      
      const handle = generateHandle(title, prodIndex);
      const description = "Premium quality T-shirt from Mango.";
      
      const images: { url: string }[] = []
      if (thumbnail) images.push({ url: thumbnail })
      if (img1) images.push({ url: img1 })
      if (img2) images.push({ url: img2 })
      if (img3) images.push({ url: img3 })

      const variants = sizes.map(size => {
        return {
          title: size,
          sku: `${handle}-${size}`.toUpperCase(),
          options: { Size: size },
          manage_inventory: true,
          prices: [
            { amount: price, currency_code: "inr" }
          ]
        }
      })

      productsToCreate.push({
        title,
        handle,
        description,
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfileId,
        category_ids: targetCategory ? [targetCategory.id] : [],
        images,
        options: [
          { title: "Size", values: sizes }
        ],
        variants,
        sales_channels: [{ id: salesChannelId }]
      })
      
      prodIndex++;
  }

  logger.info(`Total products to create: ${productsToCreate.length}. Creating in batches of 50...`)

  const BATCH_SIZE = 50
  const failedBatches: string[] = []

  for (let i = 0; i < productsToCreate.length; i += BATCH_SIZE) {
    const batch = productsToCreate.slice(i, i + BATCH_SIZE)
    const batchNo = Math.floor(i / BATCH_SIZE) + 1
    logger.info(`Processing batch ${batchNo} of ${Math.ceil(productsToCreate.length/BATCH_SIZE)}...`)

    try {
      await createProductsWorkflow(container).run({
        input: { products: batch }
      })
    } catch (e) {
      logger.error(`Error in batch ${batchNo}: ${e.message}`)
      failedBatches.push(`batch ${batchNo}: ${e.message}`)
    }
  }

  logger.info("Setting inventory levels for all new products...")
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })

  const inventoryLevels = inventoryItems.map((item: any) => ({
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

  if (failedBatches.length > 0) {
      logger.error(`Import finished with some failures: ${failedBatches.join(", ")}`)
  } else {
      logger.info(`Successfully imported ${productsToCreate.length} products to database!`)
  }
}
