import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";
import {
  categories as brandCategories,
  products as brandProducts,
  region as brandRegion,
  salesChannelName,
  stockLocation as brandStockLocation,
  store as brandStore,
  type SeedProduct,
} from "../data/bacoola-seed";

/**
 * Builds the inline product options and the full variant matrix (sizes x
 * colors) for a single brand product. Kept generic so the catalog is driven
 * entirely by `src/data/bacoola-seed.ts`.
 */
function buildProductVariantsAndOptions(product: SeedProduct) {
  const hasColor = !!product.colors?.length;
  const colors = hasColor ? product.colors! : [undefined];

  const options = hasColor
    ? [
        { title: "Size", values: product.sizes },
        { title: "Color", values: product.colors! },
      ]
    : [{ title: "Size", values: product.sizes }];

  const skuBase = product.handle.toUpperCase();
  const variants = product.sizes.flatMap((size) =>
    colors.map((color) => {
      const variantOptions: Record<string, string> = { Size: size };
      if (color) {
        variantOptions.Color = color;
      }
      return {
        title: color ? `${size} / ${color}` : size,
        sku: color
          ? `${skuBase}-${size}-${color.toUpperCase()}`
          : `${skuBase}-${size}`,
        options: variantOptions,
        prices: [
          { amount: product.prices.inr, currency_code: "inr" },
          { amount: product.prices.usd, currency_code: "usd" },
        ],
      };
    })
  );

  return { options, variants };
}

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  const countries = brandRegion.countries;

  logger.info(`Seeding store data for ${brandStore.name}...`);
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [{ name: salesChannelName }],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Storefront Publishable API Key",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  });

  await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: brandStore.name,
          supported_currencies: brandStore.currencies,
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  });

  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: brandRegion.name,
          currency_code: brandRegion.currency_code,
          countries,
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
    })),
  });

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: brandStockLocation.name,
          address: {
            city: brandStockLocation.city,
            country_code: brandStockLocation.country_code,
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: `${brandStockLocation.name} delivery`,
    type: "shipping",
    service_zones: [
      {
        name: brandRegion.name,
        geo_zones: countries.map((country_code) => ({
          country_code,
          type: "country" as const,
        })),
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Ship in 2-3 days.",
          code: "standard",
        },
        prices: [
          { currency_code: "inr", amount: 99 },
          { currency_code: "usd", amount: 10 },
          { region_id: region.id, amount: 99 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
      {
        name: "Express Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Ship in 24 hours.",
          code: "express",
        },
        prices: [
          { currency_code: "inr", amount: 199 },
          { currency_code: "usd", amount: 15 },
          { region_id: region.id, amount: 199 },
        ],
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      },
    ],
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });

  logger.info("Seeding product categories...");
  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: brandCategories.map((name) => ({
        name,
        is_active: true,
      })),
    },
  });

  const categoryIdByName = new Map(
    categoryResult.map((cat) => [cat.name, cat.id])
  );

  logger.info("Seeding products...");
  await createProductsWorkflow(container).run({
    input: {
      products: brandProducts.map((product) => {
        const { options, variants } = buildProductVariantsAndOptions(product);
        return {
          title: product.title,
          handle: product.handle,
          description: product.description,
          weight: product.weight ?? 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          category_ids: product.categories.map(
            (name) => categoryIdByName.get(name)!
          ),
          images: product.images.map((url) => ({ url })),
          options,
          variants,
          sales_channels: [{ id: defaultSalesChannel.id }],
        };
      }),
    },
  });

  logger.info("Seeding inventory levels...");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 1000000,
        inventory_item_id: item.id,
      })),
    },
  });

  logger.info(
    `Finished seeding ${brandStore.name}: ${brandProducts.length} products across ${brandCategories.length} categories.`
  );
}
