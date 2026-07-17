import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function checkDupes({ container }: { container: MedusaContainer }) {
  const productModule = container.resolve(Modules.PRODUCT)
  const cats = await productModule.listProductCategories({}, { take: 2000, select: ["id", "name", "handle", "parent_category_id"] })
  
  const women = cats.find(c => c.handle === "women")
  if (women) {
    const children = cats.filter(c => c.parent_category_id === women.id)
    console.log(`Children for Women (${women.id}):`)
    children.forEach(c => console.log(`- ${c.name} (${c.handle})`))
  }
}
