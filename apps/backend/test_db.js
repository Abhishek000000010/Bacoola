const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_4vUH5MtPScCD@ep-wandering-grass-aonp776h.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require' });
client.connect().then(() => {
  return client.query(`
    SELECT p.code, p.type, p.is_automatic, pr.attribute, pr.operator, prv.value
    FROM promotion p
    LEFT JOIN promotion_rule pr ON p.id = pr.promotion_id
    LEFT JOIN promotion_rule_value prv ON pr.id = prv.promotion_rule_id
    ORDER BY p.created_at DESC
    LIMIT 5;
  `);
}).then(res => {
  console.table(res.rows);
  return client.end();
}).catch(console.error);
