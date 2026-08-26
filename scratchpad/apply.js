const { Client } = require('../backend/node_modules/pg');
const fs = require('fs');
const path = require('path');

// Read backend/.env
const envPath = path.join(__dirname, '..', 'backend', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val.trim();
  }
});

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node apply.js <path-to-sql-file>');
  process.exit(1);
}

const absolutePath = path.resolve(filePath);
if (!fs.existsSync(absolutePath)) {
  console.error('File not found:', absolutePath);
  process.exit(1);
}

const sql = fs.readFileSync(absolutePath, 'utf8');

async function run() {
  const client = new Client({
    host: env.DB_HOST,
    port: parseInt(env.DB_PORT || '5432'),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(`Applying migration: ${path.basename(absolutePath)}...`);
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log(`Successfully applied: ${path.basename(absolutePath)}`);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    console.error('Migration failed:', err.message);
    if (err.position) console.error('Position:', err.position);
    if (err.detail) console.error('Detail:', err.detail);
    if (err.hint) console.error('Hint:', err.hint);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
