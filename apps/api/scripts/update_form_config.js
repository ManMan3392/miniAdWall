const mysql = require('mysql2/promise');
require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'adwall',
  waitForConnections: true,
  connectionLimit: 10,
});

// 完善的表单配置，包含所有必需的基础字段
const formConfigs = {
  short_video: {
    formTitle: '创建短视频广告',
    fields: [
      {
        name: 'publisher',
        type: 'input',
        label: '发布者',
        required: true,
        placeholder: '请输入发布者名称',
      },
      {
        name: 'title',
        type: 'input',
        label: '广告标题',
        required: true,
        placeholder: '请输入吸引用户的短视频标题（不超过30字）',
      },
      {
        name: 'content',
        type: 'input',
        label: '广告内容',
        required: true,
        placeholder: '请输入广告详细内容',
      },
      {
        name: 'landing_url',
        type: 'input',
        label: '落地页URL',
        required: true,
        placeholder: '请输入落地页链接，如 https://example.com',
      },
      {
        name: 'price',
        type: 'number',
        label: '初始出价（元/千次曝光）',
        required: true,
        placeholder: '请输入出价，最低0.5元',
      },
      {
        name: 'videos',
        type: 'video-upload',
        label: '短视频素材',
        required: true,
      },
    ],
  },
  brand: {
    formTitle: '创建品牌广告',
    fields: [
      {
        name: 'publisher',
        type: 'input',
        label: '发布者',
        required: true,
        placeholder: '请输入发布者名称',
      },
      {
        name: 'title',
        type: 'input',
        label: '广告标题',
        required: true,
        placeholder: '请输入品牌广告标题（不超过20字）',
      },
      {
        name: 'content',
        type: 'input',
        label: '广告内容',
        required: true,
        placeholder: '请输入品牌广告详细内容',
      },
      {
        name: 'landing_url',
        type: 'input',
        label: '落地页URL',
        required: true,
        placeholder: '请输入品牌官网链接',
      },
      {
        name: 'price',
        type: 'number',
        label: '初始出价（元/千次曝光）',
        required: true,
        placeholder: '品牌广告基础出价较高，建议≥10元',
      },
      {
        name: 'brand_slogan',
        type: 'input',
        label: '品牌口号',
        required: false,
        placeholder: '请输入品牌宣传口号',
      },
      {
        name: 'videos',
        type: 'video-upload',
        label: '品牌宣传视频',
        required: true,
      },
    ],
  },
  effect: {
    formTitle: '创建效果广告',
    fields: [
      {
        name: 'publisher',
        type: 'input',
        label: '发布者',
        required: true,
        placeholder: '请输入发布者名称',
      },
      {
        name: 'title',
        type: 'input',
        label: '广告标题',
        required: true,
        placeholder: '请输入广告标题（不超过25字）',
      },
      {
        name: 'content',
        type: 'input',
        label: '广告内容',
        required: true,
        placeholder: '请输入广告详细内容',
      },
      {
        name: 'landing_url',
        type: 'input',
        label: '落地页URL',
        required: true,
        placeholder: '请输入转化落地页链接',
      },
      {
        name: 'price',
        type: 'number',
        label: '初始出价（元/转化）',
        required: true,
        placeholder: '请输入出价，最低0.1元',
      },
      {
        name: 'conversion_target',
        type: 'select',
        label: '转化目标',
        required: false,
        enums: ['App下载', '表单提交', '商品购买'],
      },
      {
        name: 'videos',
        type: 'video-upload',
        label: '效果宣传视频',
        required: true,
      },
    ],
  },
};

async function updateFormConfigs() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');

    for (const [typeCode, config] of Object.entries(formConfigs)) {
      // 获取 type_id
      const [typeRows] = await connection.query(
        'SELECT id FROM ad_type WHERE type_code = ? LIMIT 1',
        [typeCode],
      );

      if (typeRows.length === 0) {
        console.log(`⚠️  未找到类型: ${typeCode}`);
        continue;
      }

      const typeId = typeRows[0].id;
      const configValue = JSON.stringify(config);

      // 更新或插入配置
      await connection.query(
        `INSERT INTO form_config (type_id, config_key, config_value, update_time)
         VALUES (?, 'ad_create_form', ?, NOW())
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), update_time = NOW()`,
        [typeId, configValue],
      );

      console.log(`✅ 已更新 ${typeCode} 的表单配置`);
    }

    // 显示当前所有配置
    const [configs] = await connection.query(`
      SELECT 
        at.type_code,
        at.type_name,
        fc.config_value
      FROM form_config fc
      JOIN ad_type at ON fc.type_id = at.id
      WHERE fc.config_key = 'ad_create_form'
      ORDER BY at.id
    `);

    console.log('\n📋 当前表单配置:');
    configs.forEach((row) => {
      const config = JSON.parse(row.config_value);
      console.log(`\n${row.type_name} (${row.type_code}):`);
      console.log(`  字段数量: ${config.fields.length}`);
      console.log(
        `  必需字段: ${config.fields
          .filter((f) => f.required)
          .map((f) => f.name)
          .join(', ')}`,
      );
    });

    console.log('\n✅ 表单配置更新完成！');
  } catch (error) {
    console.error('❌ 更新失败:', error);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

updateFormConfigs();
