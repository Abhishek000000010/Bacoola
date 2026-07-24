const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_4vUH5MtPScCD@ep-wandering-grass-aonp776h.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });

async function main() {
  await client.connect();
  
  // Check for landing tables
  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%landing%'");
  console.log('Landing tables:', tables.rows);
  
  // Check for video URLs in landing items
  if (tables.rows.length > 0) {
    const items = await client.query("SELECT id, title, video_url, desktop_image FROM landing_section_item WHERE video_url IS NOT NULL LIMIT 10");
    console.log('Items with video:', items.rows);
  }
  
  await client.end();
}

main().catch(e => { console.error(e.message); client.end(); });
