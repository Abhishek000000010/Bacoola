/**
 * Brand-specific seed data for Bacoola.
 *
 * This file is the ONLY place you edit to rebrand the sample catalog for a new
 * clothing brand: change the store name, region, categories, and products here.
 * The seed runner (src/migration-scripts/initial-data-seed.ts) is generic and
 * builds everything from this data — no code changes needed to re-theme.
 *
 * Product images below are public placeholders; replace them with your own
 * assets (which will be uploaded to Cloudinary) once you have product photos.
 */

export const store = {
  name: "Bacoola",
  // First entry is the default currency. INR is the default because payments
  // use Razorpay, which settles in INR.
  currencies: [
    { currency_code: "inr", is_default: true },
    { currency_code: "usd", is_default: false },
  ],
}

export const salesChannelName = "Bacoola Storefront"

/**
 * Primary market. `NEXT_PUBLIC_DEFAULT_REGION` in the storefront must be one of
 * the country codes below (defaults to "in").
 */
export const region = {
  name: "India",
  currency_code: "inr",
  countries: ["in"],
}

export const stockLocation = {
  name: "Main Warehouse",
  city: "Mumbai",
  country_code: "IN",
}

/** Category names shown in the storefront navigation. */
export const categories = ["Men", "Women", "T-Shirts", "Polos"]

export type SeedProduct = {
  title: string
  handle: string
  description: string
  /** Category names (must exist in `categories` above). */
  categories: string[]
  sizes: string[]
  /** Omit for single-option (size-only) products. */
  colors?: string[]
  images: string[]
  /** Price per variant, in major currency units (e.g. 1499 = ₹1499). */
  prices: { inr: number; usd: number }
  /** Grams; used for shipping estimates. */
  weight?: number
}

const IMG = "https://medusa-public-images.s3.eu-west-1.amazonaws.com"

export const products: SeedProduct[] = [
  {
    title: "Bacoola Classic Crew Tee",
    handle: "classic-crew-tee",
    description:
      "A wardrobe staple. Soft, breathable combed cotton with a clean crew neck and a relaxed everyday fit.",
    categories: ["T-Shirts", "Men"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White"],
    images: [`${IMG}/tee-black-front.png`, `${IMG}/tee-black-back.png`],
    prices: { inr: 1499, usd: 29 },
    weight: 220,
  },
  {
    title: "Bacoola Women's Relaxed Tee",
    handle: "womens-relaxed-tee",
    description:
      "An effortlessly relaxed tee cut for an easy drape. Mid-weight cotton that keeps its shape wash after wash.",
    categories: ["T-Shirts", "Women"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Navy"],
    images: [`${IMG}/tee-white-front.png`, `${IMG}/tee-white-back.png`],
    prices: { inr: 1499, usd: 29 },
    weight: 200,
  },
  {
    title: "Bacoola Signature Piqué Polo",
    handle: "signature-pique-polo",
    description:
      "A refined take on the classic polo in textured piqué cotton, with a ribbed collar and a tailored fit.",
    categories: ["Polos", "Men"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "Navy"],
    images: [`${IMG}/tee-black-front.png`],
    prices: { inr: 2499, usd: 49 },
    weight: 300,
  },
  {
    title: "Bacoola Women's Piqué Polo",
    handle: "womens-pique-polo",
    description:
      "A polished piqué polo designed with a feminine cut and a soft ribbed collar for a crisp, put-together look.",
    categories: ["Polos", "Women"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["White", "Navy"],
    images: [`${IMG}/tee-white-front.png`],
    prices: { inr: 2499, usd: 49 },
    weight: 280,
  },
  {
    title: "Bacoola Everyday Henley",
    handle: "everyday-henley",
    description:
      "A versatile three-button henley in heavyweight cotton — layer it or wear it on its own.",
    categories: ["Men"],
    sizes: ["S", "M", "L", "XL"],
    images: [`${IMG}/sweatshirt-vintage-front.png`],
    prices: { inr: 1999, usd: 39 },
    weight: 350,
  },
]
