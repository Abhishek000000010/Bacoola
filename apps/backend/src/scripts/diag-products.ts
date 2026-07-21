import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function myScript({ container }: { container: MedusaContainer }) {
  const query = container.resolve("query")
  const { data } = await query.graph({
    entity: "product",
    fields: ["title", "categories.handle"],
    filters: { title: "Jeans - Essential Collection 5" }
  })
  console.log(JSON.stringify(data, null, 2))
}
