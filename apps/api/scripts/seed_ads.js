require('dotenv').config();
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

(async () => {
  const DB_HOST = process.env.DB_HOST || '127.0.0.1';
  const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
  const DB_USER = process.env.DB_USER || 'root';
  const DB_PASS = process.env.DB_PASS || process.env.DB_PASSWORD || '';
  const DB_NAME = process.env.DB_NAME || 'adwall';

  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    charset: 'utf8mb4',
    connectTimeout: 10000,
  });

  // Ensure connection uses utf8mb4 for sending/receiving text
  await conn.query('SET NAMES utf8mb4;');

  console.log(`[seed] Using database: ${DB_NAME}`);
  await conn.query(`USE \`${DB_NAME}\`;`);

  // Ensure types exist
  const typeCodes = ['short_video', 'brand', 'effect'];
  const typeMap = {};
  for (const code of typeCodes) {
    const [rows] = await conn.query(
      'SELECT id FROM ad_type WHERE type_code = ? LIMIT 1',
      [code],
    );
    if (!rows.length) {
      throw new Error(
        `[seed] Missing ad_type: ${code}. Please run schema.sql or insert the type first.`,
      );
    }
    typeMap[code] = rows[0].id;
  }

  const base = {
    publisher: '巨量引擎',
    title: '字节广告君',
    content:
      '巨量引擎是字节跳动旗下综合的数字化营销服务平台，致力于让不分体量、地域的企业及个体，都能通过数字化技术激发创造、驱动生意，实现商业的可持续增长。',
    heat: 100,
    price: 100.0,
    landing_url: 'https://www.oceanengine.com/',
  };

  const toInsert = [
    { type_code: 'short_video' },
    { type_code: 'brand' },
    { type_code: 'effect' },
  ];

  let inserted = 0;
  for (const item of toInsert) {
    const typeId = typeMap[item.type_code];
    // Avoid duplicates by same type_id + title
    const [exist] = await conn.query(
      'SELECT id FROM ad WHERE type_id = ? AND title = ? LIMIT 1',
      [typeId, base.title],
    );
    if (exist.length) {
      console.log(`[seed] Skip existing ad for type ${item.type_code}`);
      continue;
    }
    const id = uuidv4();
    await conn.query(
      'INSERT INTO ad (id, type_id, publisher, title, content, heat, price, landing_url, video_ids, ext_info, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [
        id,
        typeId,
        base.publisher,
        base.title,
        base.content,
        base.heat,
        base.price,
        base.landing_url,
        '',
        null,
      ],
    );
    console.log(`[seed] Inserted ad ${id} for type ${item.type_code}`);
    inserted += 1;
  }

  console.log(`[seed] Done. Inserted: ${inserted}`);
  await conn.end();
})().catch((err) => {
  console.error('[seed] Failed:', err?.message || err);
  process.exit(1);
});
