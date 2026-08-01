const BE = "C:/Projects/bacoola-2/apps/backend"
require(require.resolve("dotenv", { paths: [BE] })).config({ path: BE + "/.env" })
const { Client } = require(require.resolve("pg", { paths: [BE] }))

// One marker per category import; keep both lists in sync when adding another.
const MARKERS = ["mango-newnow-v2", "mango-men-newnow-v1"]
// Parenthesised: these get interpolated into a larger `where ... and <cond>`.
const IMPORTED = `(${MARKERS.map((m) => `p.metadata->>'${m}' = 'true'`).join(" or ")})`
const HANDMADE = `(${MARKERS.map((m) => `coalesce(p.metadata->>'${m}','') <> 'true'`).join(" and ")})`

async function main() {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    statement_timeout: 60000,
    connectionTimeoutMillis: 15000,
  })
  await c.connect()
  const q = async (sql) => (await c.query(sql)).rows

  for (const [label, cond] of [
    ["IMPORTED (mango-newnow-v2)", IMPORTED],
    ["PRE-EXISTING / HAND-MADE", HANDMADE],
  ]) {
    const [tot] = await q(`
      select
        count(distinct p.id)::int products,
        count(distinct p.id) filter (where p.status = 'published')::int published,
        count(distinct p.id) filter (where p.thumbnail is not null)::int with_thumb
      from product p
      where p.deleted_at is null and ${cond}`)

    const [vt] = await q(`
      select
        count(*)::int variants,
        count(*) filter (where v.weight is not null and v.length is not null
                           and v.width is not null and v.height is not null)::int full_dims,
        count(*) filter (where v.sku is not null)::int with_sku,
        count(*) filter (where v.manage_inventory)::int managed
      from product p join product_variant v on v.product_id = p.id and v.deleted_at is null
      where p.deleted_at is null and ${cond}`)

    const opts = await q(`
      select o.title, count(distinct p.id)::int products
      from product p
      join product_product_option ppo on ppo.product_id = p.id and ppo.deleted_at is null
      join product_option o on o.id = ppo.product_option_id and o.deleted_at is null
      where p.deleted_at is null and ${cond}
      group by o.title order by 2 desc`)

    // Prices live behind the pricing module's link table.
    const cur = await q(`
      select pr.currency_code, count(*)::int prices
      from product p
      join product_variant v on v.product_id = p.id and v.deleted_at is null
      join product_variant_price_set link on link.variant_id = v.id and link.deleted_at is null
      join price pr on pr.price_set_id = link.price_set_id and pr.deleted_at is null
      where p.deleted_at is null and ${cond}
      group by pr.currency_code order by 1`)

    console.log(`\n=== ${label} ===`)
    console.log(`  products: ${tot.products} (published ${tot.published}, with thumbnail ${tot.with_thumb})`)
    console.log(`  variants: ${vt.variants}`)
    console.log(`    full dimensions : ${vt.full_dims}/${vt.variants}`)
    console.log(`    has SKU         : ${vt.with_sku}/${vt.variants}`)
    console.log(`    manage_inventory: ${vt.managed}/${vt.variants}`)
    console.log(`  options : ${opts.map((o) => `${o.title}=${o.products}`).join(", ") || "(none)"}`)
    console.log(`  prices  : ${cur.map((r) => `${r.currency_code}=${r.prices}`).join(", ") || "(none)"}`)
  }

  console.log("\n=== SUPPLIER-HOSTED IMAGERY REMAINING ===")
  const [img] = await q(`
    select count(*)::int n from image
    where deleted_at is null and (url like '%mango.com%' or url like '%mngbcn.com%')`)
  const [thumb] = await q(`
    select count(*)::int n from product
    where deleted_at is null and (thumbnail like '%mango.com%' or thumbnail like '%mngbcn.com%')`)
  console.log(`  product images on supplier CDN : ${img.n}`)
  console.log(`  product thumbnails on it       : ${thumb.n}`)

  console.log("\n=== THE PRE-EXISTING PRODUCTS ===")
  const list = await q(`
    select p.title, p.handle, p.status,
      (select count(*)::int from product_variant v where v.product_id = p.id and v.deleted_at is null) variants,
      (select string_agg(o.title, '+' order by o.title)
        from product_product_option ppo
        join product_option o on o.id = ppo.product_option_id and o.deleted_at is null
        where ppo.product_id = p.id and ppo.deleted_at is null) opts
    from product p where p.deleted_at is null and ${HANDMADE}`)
  for (const r of list) {
    console.log(`  ${r.title} | ${r.handle} | ${r.status} | ${r.variants} variants | opts=[${r.opts || "none"}]`)
  }

  await c.end()
}

main().catch((e) => {
  console.log("ERR:", e.message)
  process.exit(1)
})
