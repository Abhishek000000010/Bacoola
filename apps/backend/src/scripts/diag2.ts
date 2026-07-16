import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
export default async function diag({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id","display_id","created_at","shipping_address.first_name","shipping_address.last_name","shipping_address.city","shipping_address.province","shipping_address.phone","fulfillments.id","fulfillments.data"],
  });
  const sorted = (orders ?? []).sort((a:any,b:any)=>String(b.created_at).localeCompare(String(a.created_at)));
  logger.info(`TOTAL: ${sorted.length}`);
  for (const o of sorted.slice(0,3)) {
    const f=(o.fulfillments??[])[0];
    logger.info(`#${o.display_id} ${o.shipping_address?.first_name} ${o.shipping_address?.last_name} @ ${o.created_at}`);
    logger.info(`   city=${JSON.stringify(o.shipping_address?.city)} state=${JSON.stringify(o.shipping_address?.province)} phone=${o.shipping_address?.phone} fulfillments=${(o.fulfillments??[]).length}${f?` sr=${f.data?.order_id}`:""}`);
  }
}
