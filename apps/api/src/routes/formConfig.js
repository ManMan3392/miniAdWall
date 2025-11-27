const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const { type_code, config_key } = req.query;
  if (!type_code) {
    return res.status(400).json({ code: 400, message: 'type_code required' });
  }

  try {
    const [types] = await db.query(
      'SELECT id FROM ad_type WHERE type_code = ? LIMIT 1',
      [type_code],
    );
    if (!types || types.length === 0) {
      return res.json({
        code: 200,
        data: { formTitle: '默认广告表单', fields: [] },
        message: '类型不存在，返回默认配置',
      });
    }
    const typeId = types[0].id;
    const key = config_key || 'ad_create_form';
    const [cfg] = await db.query(
      'SELECT config_value FROM form_config WHERE type_id = ? AND config_key = ? ORDER BY update_time DESC LIMIT 1',
      [typeId, key],
    );
    if (cfg && cfg.length) {
      let parsed;
      try {
        parsed = JSON.parse(cfg[0].config_value);
      } catch (e) {
        parsed = { formTitle: '配置解析错误', fields: [] };
      }
      return res.json({ code: 200, data: parsed });
    } else {
      const defaultMap = {
        short_video: {
          formTitle: '创建短视频广告',
          fields: [
            { name: 'title', type: 'input' },
            { name: 'videos', type: 'video-upload' },
          ],
        },
        brand: {
          formTitle: '创建品牌广告',
          fields: [
            { name: 'title', type: 'input' },
            { name: 'brand_logo', type: 'image-upload' },
          ],
        },
        effect: {
          formTitle: '创建效果广告',
          fields: [
            { name: 'title', type: 'input' },
            { name: 'conversion_target', type: 'select' },
          ],
        },
      };
      const tc = type_code;
      return res.json({
        code: 200,
        data: defaultMap[tc] || { formTitle: '默认广告表单', fields: [] },
        message: '默认配置',
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '查询配置失败' });
  }
});

module.exports = router;
