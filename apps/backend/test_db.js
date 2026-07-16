const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_4vUH5MtPScCD@ep-wandering-grass-aonp776h.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });
client.connect().then(() => {
  return client.query(`
    SELECT o.display_id, o.payment_status, o.status
    FROM "order" o 
    WHERE o.display_id IN (16, 17, 18, 19);
  `);
}).then(res => {
  console.table(res.rows);
  return client.end();
}).catch(console.error);
