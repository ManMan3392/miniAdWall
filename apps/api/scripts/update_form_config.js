const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
console.log('[update_form_config] resolve .env ->', envPath);
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
  console.log(
    '[update_form_config] dotenv load error:',
    envResult.error.message || envResult.error,
  );
} else {
  const parsed = envResult.parsed || {};
  console.log('[update_form_config] dotenv loaded (masked):', {
    DB_HOST: parsed.DB_HOST || process.env.DB_HOST || '<not set>',
    DB_PORT: parsed.DB_PORT || process.env.DB_PORT || '<not set>',
    DB_USER: parsed.DB_USER || process.env.DB_USER || '<not set>',
  });
}

const dns = require('dns').promises;

async function createPoolWithResolvedHost() {
  let host = process.env.DB_HOST || '127.0.0.1';
  try {
    const res = await dns.lookup(host, { family: 4 });
    if (res && res.address) {
      console.log('[update_form_config] dns.lookup IPv4 ->', res.address);
      host = res.address;
    }
  } catch (err) {
    console.log(
      '[update_form_config] IPv4 lookup failed, will use hostname:',
      host,
      err && err.message,
    );
  }

  return mysql.createPool({
    host,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'adwall',
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 10000,
  });
}

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
        required: false,
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
        required: false,
      },
    ],
  },
};

async function updateFormConfigs() {
  let connection;
  try {
    const pool = await createPoolWithResolvedHost();
    connection = await pool.getConnection();

    for (const [typeCode, config] of Object.entries(formConfigs)) {
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

      await connection.query(
        `INSERT INTO form_config (type_id, config_key, config_value, update_time)
         VALUES (?, 'ad_create_form', ?, NOW())
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), update_time = NOW()`,
        [typeId, configValue],
      );

      console.log(`✅ 已更新 ${typeCode} 的表单配置`);
    }

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
      let config;
      try {
        config = JSON.parse(row.config_value);
      } catch (err) {
        console.error(
          '[update_form_config] JSON.parse failed for',
          row.type_code,
          'error:',
          err && err.message,
        );
        console.error(
          '[update_form_config] config_value length:',
          row.config_value ? row.config_value.length : 0,
        );
        console.error(
          '[update_form_config] config_value preview:',
          row.config_value ? row.config_value.slice(0, 800) : '<empty>',
        );
        return;
      }

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
    try {
      if (typeof pool !== 'undefined' && pool) await pool.end();
    } catch (e) {
      console.log('[update_form_config] pool.end error', e && e.message);
    }
  }
}

updateFormConfigs();
