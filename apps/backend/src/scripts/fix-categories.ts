import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function fixCategories({ container }: { container: MedusaContainer }) {
  const productModule = container.resolve(Modules.PRODUCT)
  const cats = await productModule.listProductCategories({}, { take: 2000, select: ["id", "name", "handle", "parent_category_id"] })
  
  const women = cats.find(c => c.handle === "women")
  const men = cats.find(c => c.handle === "men")

  const toDelete: string[] = []

  // Delete all children of Women
  if (women) {
    const children = cats.filter(c => c.parent_category_id === women.id)
    for (const child of children) {
      toDelete.push(child.id)
      // also delete their children
      const subChildren = cats.filter(c => c.parent_category_id === child.id)
      for (const sub of subChildren) {
        toDelete.push(sub.id)
        const subSubChildren = cats.filter(c => c.parent_category_id === sub.id)
        toDelete.push(...subSubChildren.map(c => c.id))
      }
    }
  }

  // Delete all children of Men
  if (men) {
    const children = cats.filter(c => c.parent_category_id === men.id)
    for (const child of children) {
      toDelete.push(child.id)
      // also delete their children
      const subChildren = cats.filter(c => c.parent_category_id === child.id)
      for (const sub of subChildren) {
        toDelete.push(sub.id)
        const subSubChildren = cats.filter(c => c.parent_category_id === sub.id)
        toDelete.push(...subSubChildren.map(c => c.id))
      }
    }
  }

  console.log(`Deleting ${toDelete.length} old sub-categories for Men and Women...`)
  for (const id of toDelete) {
    try {
      await productModule.deleteProductCategories([id])
    } catch (e) {
      // ignore
    }
  }

  console.log("Re-seeding Men and Women categories...")

  const existing = await productModule.listProductCategories({}, { take: 2000 })
  async function getOrCreate(name: string, handle: string, parentId: string | null = null) {
    let cat = existing.find(c => c.handle === handle)
    if (cat) return cat
    const created = await productModule.createProductCategories([{
      name, handle, parent_category_id: parentId, is_active: true
    }])
    existing.push(created[0])
    return created[0]
  }

  const makeLevel3 = async (parent: any, parentPrefix: string, items: string[]) => {
    for (const item of items) {
      const safeHandle = `${parentPrefix}-${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      await getOrCreate(item, safeHandle, parent.id)
    }
  }

  // RE-SEED WOMEN
  const wSale = await getOrCreate("Sale 40% off", "women-sale-40-v2", women?.id)
  await makeLevel3(wSale, "ws-v2", ["See all", "Dresses and jumpsuits", "Trousers", "Jeans", "Tops", "Shirts & Blouses", "Bags", "Skirts", "Shorts and Bermuda Shorts", "Linen", "Total Look", "Blazers", "Jackets", "Coats", "Sweaters and cardigans", "T-shirts", "Bikinis and swimsuits", "Jewellery", "More accessories", "Pyjamas", "Leather"])
  
  await getOrCreate("New Now", "women-new-now-v2", women?.id)
  await getOrCreate("Party and events", "women-party-events-v2", women?.id)
  await getOrCreate("For youNew", "women-for-younew-v2", women?.id)
  
  const wClothing = await getOrCreate("Clothing", "women-clothing-v2", women?.id)
  await makeLevel3(wClothing, "wc-v2", ["Dresses and jumpsuits", "Tops", "Trousers", "Shorts and Bermuda Shorts", "Skirts", "Shirts & Blouses", "Jeans", "Sweaters and cardigans", "Jackets", "Total Look", "T-shirts", "Bikinis and swimsuits", "Blazers", "Coats", "Pyjamas"])
  
  const wShoes = await getOrCreate("Shoes and accessories", "women-shoes-accessories-v2", women?.id)
  await makeLevel3(wShoes, "wa-v2", ["Bags", "Jewellery", "Belts", "Wallets and cases", "Scarves and shawls", "Caps and hats", "Sunglasses", "Other accessories", "Leather"])
  
  const wPlus = await getOrCreate("Plus Sizes", "women-plus-sizes-v2", women?.id)
  await makeLevel3(wPlus, "wp-v2", ["See all", "Coats", "Dresses and jumpsuits", "Sweaters and cardigans", "Jackets", "Trousers", "Jeans", "Blazers", "Shirts & Blouses", "Skirts", "Tops", "T-shirts", "Shorts and Bermuda Shorts"])
  
  const wCollections = await getOrCreate("Collections", "women-collections-v2", women?.id)
  await makeLevel3(wCollections, "wcol-v2", ["Linen", "Crochet & openwork", "Online Exclusive", "Swimwear", "Selection", "Office looks", "Maternity wear"])
  
  const wFeatured = await getOrCreate("Featured", "women-featured-v2", women?.id)
  await makeLevel3(wFeatured, "wf-v2", ["Holiday Outfits", "Total white", "Best sellers", "Summer Nights", "Chocolate"])

  // RE-SEED MEN
  const mSale = await getOrCreate("Sale 40% off", "men-sale-40-v2", men?.id)
  const mNew = await getOrCreate("New Now", "men-new-now-v2", men?.id)
  const mVac = await getOrCreate("Vacations", "men-vacations-v2", men?.id)
  
  const mClothing = await getOrCreate("Clothing", "men-clothing-v2", men?.id)
  await makeLevel3(mClothing, "mc-v2", ["Trousers", "Linen", "Shirts", "Blazers", "Polos", "T-shirts", "Shorts", "Swimwear", "Short-sleeved knitwear", "Jeans", "Overshirts", "Jackets", "Sweaters and cardigans", "Sweatshirts", "Trench coats", "Coats", "Underwear", "Pyjamas"])
  
  const mSuits = await getOrCreate("Suits", "men-suits-v2", men?.id)
  await makeLevel3(mSuits, "ms-v2", ["Suit guide", "Blazers", "Trousers", "Waistcoats", "Shirts", "Accessories"])
  
  const mShoes = await getOrCreate("Shoes and accessories", "men-shoes-accessories-v2", men?.id)
  await makeLevel3(mShoes, "ma-v2", ["Backpacks and bags", "Belts and braces", "Scarves, caps and gloves", "Sunglasses", "Wallets", "Ties, bow ties and handkerchiefs", "Caps"])
  
  const mCollections = await getOrCreate("Collections", "men-collections-v2", men?.id)
  await makeLevel3(mCollections, "mcol-v2", ["Linen", "Knitwear", "T-shirt guide", "Best sellers", "Online Exclusive", "Accessories Edition", "Performance", "Essentials", "Shirt Guide"])
  
  const mOccasions = await getOrCreate("Occasions", "men-occasional-v2", men?.id)
  await makeLevel3(mOccasions, "mo-v2", ["Summer 2026", "Office looks", "Casual", "Events"])

  console.log("Done fixing!")
}
