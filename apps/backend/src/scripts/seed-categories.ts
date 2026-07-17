import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function seedCategories({ container }: { container: MedusaContainer }) {
  console.log("Starting Kids category seeding for Bacoola...")
  const productModule = container.resolve(Modules.PRODUCT)

  try {
    const existing = await productModule.listProductCategories({}, { 
      take: 2000,
      select: ["id", "name", "handle"]
    })
    
    async function getOrCreate(name: string, handle: string, parentId: string | null = null) {
      let cat = existing.find(c => c.handle === handle)
      if (cat) return cat
      console.log(`Creating: ${name} (${handle})`)
      const created = await productModule.createProductCategories([{
        name, handle, parent_category_id: parentId, is_active: true
      }])
      existing.push(created[0])
      return created[0]
    }

    const kids = await getOrCreate("Kids", "kids")

    // The 5 main Kids categories
    const girls = await getOrCreate("Girls", "kids-girls", kids.id)
    const boys = await getOrCreate("Boys", "kids-boys", kids.id)
    const babyGirls = await getOrCreate("Baby Girls", "kids-baby-girls", kids.id)
    const babyBoys = await getOrCreate("Baby Boys", "kids-baby-boys", kids.id)
    const newborn = await getOrCreate("Newborn", "kids-newborn", kids.id)

    const makeLevel3 = async (parent: any, parentPrefix: string, items: string[]) => {
      for (const item of items) {
        const safeHandle = `${parentPrefix}-${item.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        await getOrCreate(item, safeHandle, parent.id)
      }
    }

    // --- GIRLS ---
    const gSale = await getOrCreate("Sale 40% off", "kids-girls-sale-40", girls.id)
    const gNew = await getOrCreate("New Now", "kids-girls-new-now", girls.id)
    const gSummer = await getOrCreate("Summer Club", "kids-girls-summer-club", girls.id)
    const gClothing = await getOrCreate("Clothing", "kids-girls-clothing", girls.id)
    const gShoesAcc = await getOrCreate("Shoes and accessories", "kids-girls-shoes-accessories", girls.id)
    const gCollections = await getOrCreate("Collections", "kids-girls-collections", girls.id)
    const gFeatured = await getOrCreate("Featured", "kids-girls-featured", girls.id)

    await makeLevel3(gSale, "kg-sale", ["See all", "Nuevos artículos añadidos", "Dresses and jumpsuits", "Jeans", "T-shirts and tops", "Shirts & Blouses", "Shoes", "Trousers", "Shorts", "Bikinis and swimsuits", "skirts", "Sweatshirts", "Coats and jackets", "Sweaters and cardigans", "Total look", "Leggings and joggers", "Pyjamas", "Underwear and socks", "Bags", "Jewellery", "Hair accessories", "More accessories", "Pre-Teen"])
    await makeLevel3(gClothing, "kg-clothing", ["Dresses and jumpsuits", "T-shirts and tops", "Shorts", "skirts", "Jeans", "Sweatshirts", "Shirts & Blouses", "Total look", "Pre-Teen", "Trousers", "Coats and jackets", "Bikinis and swimsuits", "Sweaters and cardigans", "Leggings and joggers", "Pyjamas", "Underwear and socks"])
    await makeLevel3(gShoesAcc, "kg-shoes-acc", ["Bags", "Jewellery", "Hair accessories", "More accessories"])
    await makeLevel3(gCollections, "kg-collections", ["Pre-Teen", "Total Look", "Events", "Accessories Edition", "Denim", "Basics"])
    await makeLevel3(gFeatured, "kg-featured", ["Travel collection", "World Cup collection", "Camps", "Best sellers"])

    // --- BOY ---
    const bSale = await getOrCreate("Sale 40% off", "kids-boys-sale-40", boys.id)
    const bNew = await getOrCreate("New Now", "kids-boys-new-now", boys.id)
    const bSummer = await getOrCreate("Summer days", "kids-boys-summer-days", boys.id)
    const bClothing = await getOrCreate("Clothing", "kids-boys-clothing", boys.id)
    const bShoesAcc = await getOrCreate("Shoes and accessories", "kids-boys-shoes-accessories", boys.id)
    const bCollections = await getOrCreate("Collections", "kids-boys-collections", boys.id)
    const bFeatured = await getOrCreate("Featured", "kids-boys-featured", boys.id)

    await makeLevel3(bSale, "kb-sale", ["See all", "T-shirts", "Trousers", "Coats and jackets", "Sweatshirts", "Sweaters and cardigans", "Linen", "Pyjamas"])
    await makeLevel3(bClothing, "kb-clothing", ["T-shirts", "Shorts", "Trousers", "Shirts", "Jeans", "Sweatshirts", "Pre-teen", "Formal", "Sweaters and cardigans", "Coats and jackets", "Joggers", "Swimwear", "Pyjamas", "Underwear and socks"])
    await makeLevel3(bShoesAcc, "kb-shoes-acc", ["Backpacks and bags", "Belts and braces", "Scarves, caps and gloves", "Sunglasses", "Wallets", "Ties, bow ties and handkerchiefs", "Caps"])
    await makeLevel3(bCollections, "kb-collections", ["PRE-TEEN", "Basics", "Total Look", "Character shop"])
    await makeLevel3(bFeatured, "kb-featured", ["Summer Camp", "Navy shades", "Best sellers"])

    // --- BABY GIRL ---
    const bgSale = await getOrCreate("Sale 40% off", "kids-babygirl-sale-40", babyGirls.id)
    const bgNew = await getOrCreate("New Now", "kids-babygirl-new-now", babyGirls.id)
    const bgSummer = await getOrCreate("Summer Club", "kids-babygirl-summer-club", babyGirls.id)
    const bgClothing = await getOrCreate("Clothing", "kids-babygirl-clothing", babyGirls.id)
    const bgShoesAcc = await getOrCreate("Shoes and accessories", "kids-babygirl-shoes-accessories", babyGirls.id)
    const bgCollections = await getOrCreate("Collections", "kids-babygirl-collections", babyGirls.id)
    const bgFeatured = await getOrCreate("Featured", "kids-babygirl-featured", babyGirls.id)

    await makeLevel3(bgSale, "kbg-sale", ["See all", "New items added", "Dresses and jumpsuits", "T-shirts", "Sweaters and cardigans", "Trousers", "Shorts and skirts", "Sweatshirts", "Shirts & Blouses", "Coats and jackets", "Denim", "Pyjamas and underwear", "Swimwear", "Bags", "Accessories"])
    await makeLevel3(bgClothing, "kbg-clothing", ["Dresses and jumpsuits", "T-shirts", "Shorts and skirts", "Jeans", "Sweatshirts", "Trousers", "Shirts & Blouses", "Denim", "Coats and jackets", "Sweaters and cardigans", "Swimwear", "Pyjamas and underwear"])
    await makeLevel3(bgShoesAcc, "kbg-shoes-acc", ["Shoes", "Bags", "Accessories"])
    await makeLevel3(bgCollections, "kbg-collections", ["Total Look", "My first denim", "Events", "Accessories Edition", "Basics", "Character shop"])
    await makeLevel3(bgFeatured, "kbg-featured", ["Travel collection", "Celebration", "Camps", "white looks", "Best sellers"])

    // --- BABY BOY ---
    const bbSale = await getOrCreate("Sale 40% off", "kids-babyboy-sale-40", babyBoys.id)
    const bbNew = await getOrCreate("New Now", "kids-babyboy-new-now", babyBoys.id)
    const bbSummer = await getOrCreate("Summer days", "kids-babyboy-summer-days", babyBoys.id)
    const bbClothing = await getOrCreate("Clothing", "kids-babyboy-clothing", babyBoys.id)
    const bbShoesAcc = await getOrCreate("Shoes and accessories", "kids-babyboy-shoes-accessories", babyBoys.id)
    const bbCollections = await getOrCreate("Collections", "kids-babyboy-collections", babyBoys.id)
    const bbFeatured = await getOrCreate("Featured", "kids-babyboy-featured", babyBoys.id)

    await makeLevel3(bbSale, "kbb-sale", ["See all", "Just added", "T-shirts", "Shorts", "Trousers", "Jumpsuits", "Coats and jackets", "Sweatshirts", "Shirts", "Jeans", "Sweaters and cardigans", "Linen", "Pyjamas", "Underwear and socks", "Accessories"])
    await makeLevel3(bbClothing, "kbb-clothing", ["T-shirts", "Shorts", "Shirts", "Trousers", "Jeans", "Jumpsuits", "Linen", "Sweatshirts", "Coats and jackets", "Sweaters and cardigans", "Swimwear", "Pyjamas", "Underwear and socks"])
    await makeLevel3(bbShoesAcc, "kbb-shoes-acc", ["Accessories"])
    await makeLevel3(bbCollections, "kbb-collections", ["Basics", "Total Look", "Character shop", "Sportswear"])
    await makeLevel3(bbFeatured, "kbb-featured", ["Ocean blues", "Best sellers", "My first denim"])

    // --- NEWBORN ---
    const nbSale = await getOrCreate("Sale 40% off", "kids-newborn-sale-40", newborn.id)
    const nbNew = await getOrCreate("New Now", "kids-newborn-new-now", newborn.id)
    const nbTotalLook = await getOrCreate("Total look", "kids-newborn-total-look", newborn.id)
    const nbClothing = await getOrCreate("Clothing", "kids-newborn-clothing", newborn.id)
    const nbShoesAcc = await getOrCreate("Shoes and accessories", "kids-newborn-shoes-accessories", newborn.id)
    const nbCollections = await getOrCreate("Collections", "kids-newborn-collections", newborn.id)
    const nbFeatured = await getOrCreate("Featured", "kids-newborn-featured", newborn.id)

    await makeLevel3(nbSale, "knb-sale", ["See all", "Dresses/Rompers", "Shirts", "Shorts", "Trousers", "T-shirts and bodies", "Sweaters and cardigans", "Coats and jackets", "Accessories", "Maternity bag", "Sweatshirts", "Swimwear", "Socks and tights"])
    await makeLevel3(nbClothing, "knb-clothing", ["See all", "Dresses/Rompers", "T-shirts and bodies", "Shorts", "Trousers", "Shirts", "Swimwear", "Sweaters and cardigans", "Sweatshirts", "Coats and jackets", "Pyjamas", "Socks and tights"])
    await makeLevel3(nbShoesAcc, "knb-shoes-acc", ["Shoes", "Accessories", "Maternity bag"])
    await makeLevel3(nbCollections, "knb-collections", ["Welcome collection", "Knitwear", "Basics", "Homewear", "Maternity wear"])
    await makeLevel3(nbFeatured, "knb-featured", ["First summer", "Celebration", "Best sellers"])

    console.log("Successfully seeded all Kids detailed categories!")
  } catch (err) {
    console.error("Error:", err)
  }
}
