const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://archos_app:app_secret@localhost:5432/archos_db?schema=public'
  });
  await client.connect();

  const res1 = await client.query('SELECT id FROM "Firm" LIMIT 1');
  const firmId = res1.rows[0].id;

  await client.query(`SELECT set_config('app.current_firm_id', '${firmId}', true)`);
  
  const res2 = await client.query('SELECT id, name, status FROM "Project"');
  console.log('Projects:', res2.rows);

  await client.end();
}
main().catch(console.error);
