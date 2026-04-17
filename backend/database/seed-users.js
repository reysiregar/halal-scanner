require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in backend/.env');
  process.exit(1);
}

const useSsl = process.env.NODE_ENV === 'production' || DATABASE_URL.includes('supabase.co');
const db = new Pool({
  connectionString: DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function upsertUser({ name, email, password, is_admin }) {
  const hashed = await bcrypt.hash(password, 10);
  const result = await db.query(
    `INSERT INTO users (name, email, password, is_admin)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email)
     DO UPDATE SET
       name = EXCLUDED.name,
       password = EXCLUDED.password,
       is_admin = EXCLUDED.is_admin
     RETURNING id, name, email, is_admin`,
    [name, email, hashed, is_admin]
  );

  return result.rows[0];
}

async function seed() {
  const adminPassword = randomString(12);
  const userPassword = randomString(12);

  const admin = await upsertUser({
    name: 'Default Admin',
    email: 'admin@halalscanner.com',
    password: adminPassword,
    is_admin: true
  });

  const user = await upsertUser({
    name: 'Default User',
    email: 'user@halalscanner.com',
    password: userPassword,
    is_admin: false
  });

  console.log('Default Admin:', admin.email, 'Password:', adminPassword);
  console.log('Default User:', user.email, 'Password:', userPassword);
}

seed()
  .then(async () => {
    await db.end();
  })
  .catch(async err => {
    console.error('Seed error:', err);
    await db.end();
    process.exit(1);
  });
