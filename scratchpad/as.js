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

const args = process.argv.slice(2);
const shouldCommit = args.includes('--commit');
const filteredArgs = args.filter(a => a !== '--commit');

if (filteredArgs.length < 2) {
  console.error('Usage: node as.js <auth_user_id|anon> "<sql>" [--commit]');
  process.exit(1);
}

const targetAuthId = filteredArgs[0];
const sql = filteredArgs.slice(1).join(' ');

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
    await client.query('BEGIN');

    if (targetAuthId === 'anon') {
      await client.query("SET LOCAL ROLE anon");
      await client.query(`SELECT set_config('request.jwt.claims', '{"role": "anon"}', true)`);
      await client.query(`SELECT set_config('request.jwt.claim.role', 'anon', true)`);
    } else {
      await client.query("SET LOCAL ROLE authenticated");
      const claims = JSON.stringify({ sub: targetAuthId, role: 'authenticated' });
      await client.query(`SELECT set_config('request.jwt.claims', $1, true)`, [claims]);
      await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [targetAuthId]);
      await client.query(`SELECT set_config('request.jwt.claim.role', 'authenticated', true)`);
    }

    const res = await client.query(sql);

    if (shouldCommit) {
      await client.query('COMMIT');
      console.log('--- Transaction COMMITTED ---');
    } else {
      await client.query('ROLLBACK');
      console.log('--- Transaction ROLLED BACK (simulation mode) ---');
    }

    if (Array.isArray(res)) {
      res.forEach((r, i) => {
        console.log(`--- Result ${i + 1} (${r.rowCount} rows) ---`);
        console.table(r.rows);
      });
    } else {
      if (res.rows && res.rows.length > 0) {
        console.table(res.rows);
      } else {
        console.log(`Query OK. rowCount: ${res.rowCount}, command: ${res.command}`);
      }
    }
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    console.error('Error executing query:', err.message);
    if (err.code) console.error('Code:', err.code);
    if (err.detail) console.error('Detail:', err.detail);
    if (err.hint) console.error('Hint:', err.hint);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
