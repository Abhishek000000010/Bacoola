const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_4vUH5MtPScCD@ep-wandering-grass-aonp776h.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });

async function fixImages() {
  await client.connect();
  
  const newUrl = 'https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png';
  
  const res = await client.query(`
    UPDATE product
    SET thumbnail = $1
    WHERE thumbnail LIKE '%res.cloudinary.com/dcbndtqye%'
  `, [newUrl]);
  
  console.log(`Updated ${res.rowCount} broken product thumbnails to valid placeholders.`);
  
  await client.end();
}

fixImages().catch(console.error);
