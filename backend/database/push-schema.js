require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in backend/.env');
  process.exit(1);
}

const useSsl = process.env.NODE_ENV === 'production' || DATABASE_URL.includes('supabase.co');

async function pushSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    await client.query(schemaSql);
    console.log('Schema applied successfully.');
  } finally {
    await client.end();
  }
}

pushSchema().catch(err => {
  console.error('Schema push error:', err.message);
  process.exit(1);
});
