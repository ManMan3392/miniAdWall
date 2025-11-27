require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixSortRule() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'adwall',
  });

  try {
    console.log('修复 effect 类型的 sort_rule...');

    const newSortRule = JSON.stringify({
      priority: 3,
      field: 'price',
      order: 'desc',
      secondField: 'created_at',
      secondOrder: 'desc',
    });

    await connection.query(
      "UPDATE ad_type SET sort_rule = ? WHERE type_code = 'effect'",
      [newSortRule],
    );

    console.log('✓ 已修复 effect 类型的 sort_rule');

    const [rows] = await connection.query(
      'SELECT type_code, sort_rule FROM ad_type',
    );
    console.log('\n当前配置：');
    rows.forEach((row) => {
      console.log(`  ${row.type_code}: ${row.sort_rule}`);
    });
  } catch (err) {
    console.error('修复失败:', err);
  } finally {
    await connection.end();
  }
}

fixSortRule();
