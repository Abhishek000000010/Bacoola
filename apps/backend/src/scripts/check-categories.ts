import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function checkCategories({
  container,
}: {
  container: MedusaContainer
}) {
  const productModule = container.resolve(Modules.PRODUCT)
  const existing = await productModule.listProductCategories({}, { take: 100 })
  console.log(existing.map(c => c.handle))
}
