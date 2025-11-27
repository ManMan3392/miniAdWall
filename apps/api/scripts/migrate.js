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
  });

  console.log(`[migrate] Using database: ${DB_NAME}`);
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
  );
  await conn.query(`USE \`${DB_NAME}\`;`);

  // Ensure ad table exists (minimal skeleton) so ALTERs won't fail on fresh DB
  await conn.query(`
    CREATE TABLE IF NOT EXISTS ad (
      id VARCHAR(36) PRIMARY KEY,
      type_id INT,
      title VARCHAR(100),
      content TEXT,
      price DECIMAL(10,2) DEFAULT 0.00,
      video_ids VARCHAR(255),
      ext_info JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  // Add base fields if missing (compat for MySQL < 8 / MariaDB: no IF NOT EXISTS)
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'ad'`,
    [DB_NAME],
  );
  const colSet = new Set(cols.map((c) => c.COLUMN_NAME));
  if (!colSet.has('publisher')) {
    await conn.query(
      `ALTER TABLE ad ADD COLUMN publisher VARCHAR(100) AFTER type_id;`,
    );
    console.log('[migrate] Added column: publisher');
  }
  if (!colSet.has('heat')) {
    await conn.query(
      `ALTER TABLE ad ADD COLUMN heat INT DEFAULT 0 AFTER content;`,
    );
    console.log('[migrate] Added column: heat');
  }
  if (!colSet.has('landing_url')) {
    await conn.query(
      `ALTER TABLE ad ADD COLUMN landing_url VARCHAR(512) AFTER price;`,
    );
    console.log('[migrate] Added column: landing_url');
  }

  console.log('[migrate] Migration completed successfully.');
  await conn.end();
})().catch((err) => {
  console.error('[migrate] Migration failed:', err?.message || err);
  process.exit(1);
});
