require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const DB_HOST = process.env.DB_HOST || '127.0.0.1';
  const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
  const DB_USER = process.env.DB_USER || 'root';
  const DB_PASS = process.env.DB_PASS || '';
  const DB_NAME = process.env.DB_NAME || 'adwall';

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
  });

  console.log(`[update] Updating landing_url for sample ads...`);

  const [result] = await conn.query(
    "UPDATE ad SET landing_url = 'https://www.oceanengine.com/' WHERE publisher = '巨量引擎' AND title = '字节广告君'",
  );

  console.log(`[update] Updated ${result.affectedRows} row(s)`);
  await conn.end();
})().catch((err) => {
  console.error('[update] Failed:', err?.message || err);
  process.exit(1);
});
