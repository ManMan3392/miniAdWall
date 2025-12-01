const db = require('../../db');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

module.exports = (router) => {
  router.post('/', async (req, res) => {
    try {
      const {
        publisher,
        title,
        content,
        price,
        landing_url,
        type_id,
        video_ids,
        ext_info,
      } = req.body;
      if (
        !publisher ||
        !title ||
        typeof content === 'undefined' ||
        typeof price === 'undefined' ||
        !landing_url
      ) {
        return res.status(400).json({
          code: 400,
          message: 'publisher、title、content、price、landing_url 为必填',
        });
      }
      if (!type_id) {
        return res.status(400).json({ code: 400, message: 'type_id 必填' });
      }
      try {
        const [typeRows] = await db.query(
          'SELECT type_code FROM ad_type WHERE id = ? LIMIT 1',
          [type_id],
        );
        const type_code =
          typeRows && typeRows[0] ? typeRows[0].type_code : null;
        let formCfg = null;
        if (type_code) {
          const [cfg] = await db.query(
            'SELECT config_value FROM form_config WHERE type_id = ? AND config_key = ? ORDER BY update_time DESC LIMIT 1',
            [type_id, 'ad_create_form'],
          );
          if (cfg && cfg.length) {
            try {
              formCfg = JSON.parse(cfg[0].config_value);
            } catch (e) {
              formCfg = null;
            }
          }
          if (!formCfg) {
            const defaultMap = {
              short_video: {
                formTitle: '创建短视频广告',
                fields: [
                  { name: 'title', type: 'input', required: true },
                  { name: 'videos', type: 'video-upload', required: true },
                ],
              },
              brand: {
                formTitle: '创建品牌广告',
                fields: [
                  { name: 'title', type: 'input', required: true },
                  { name: 'brand_logo', type: 'image-upload', required: true },
                ],
              },
              effect: {
                formTitle: '创建效果广告',
                fields: [
                  { name: 'title', type: 'input', required: true },
                  { name: 'conversion_target', type: 'select', required: true },
                ],
              },
            };
            formCfg = defaultMap[type_code] || {
              formTitle: '默认广告表单',
              fields: [],
            };
          }

          const extInfoObj =
            typeof ext_info === 'string'
              ? (() => {
                  try {
                    return JSON.parse(ext_info);
                  } catch {
                    return {};
                  }
                })()
              : typeof ext_info === 'object' && ext_info !== null
                ? ext_info
                : {};
          const fields = Array.isArray(formCfg.fields) ? formCfg.fields : [];
          for (const f of fields) {
            if (f && f.required) {
              const valFromExt = Object.prototype.hasOwnProperty.call(
                extInfoObj,
                f.name,
              )
                ? extInfoObj[f.name]
                : undefined;
              const valFromBody = Object.prototype.hasOwnProperty.call(
                req.body,
                f.name,
              )
                ? req.body[f.name]
                : undefined;
              const value =
                typeof valFromExt !== 'undefined' ? valFromExt : valFromBody;
              if (value === undefined || value === null || value === '') {
                if (f.type === 'video-upload') {
                  const vids = Array.isArray(video_ids)
                    ? video_ids
                    : typeof video_ids === 'string' && video_ids.trim()
                      ? video_ids
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean)
                      : [];
                  if (!vids.length) {
                    return res.status(400).json({
                      code: 400,
                      message: `字段 ${f.name} 必填（需上传至少一个视频）`,
                    });
                  }
                } else {
                  return res
                    .status(400)
                    .json({ code: 400, message: `字段 ${f.name} 为必填` });
                }
              }
            }
          }

          if (fields.some((f) => f.type === 'video-upload')) {
            const vids = Array.isArray(video_ids)
              ? video_ids
              : typeof video_ids === 'string' && video_ids.trim()
                ? video_ids
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [];
            if (!vids.length) {
              return res.status(400).json({
                code: 400,
                message: '请上传至少一个视频（与表单配置一致）',
              });
            }
          }
        }
      } catch (cfgErr) {
        console.warn('form-config 校验跳过：', cfgErr);
      }
      const id = uuidv4();
      const now = moment().format('YYYY-MM-DD HH:mm:ss');
      const videoIds = Array.isArray(video_ids)
        ? video_ids.join(',')
        : video_ids || '';
      await db.query(
        'INSERT INTO ad (id, type_id, publisher, title, content, heat, price, landing_url, video_ids, ext_info, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          type_id,
          publisher,
          title,
          content || '',
          0,
          Number(price) || 0.0,
          landing_url,
          videoIds,
          ext_info
            ? typeof ext_info === 'string'
              ? ext_info
              : JSON.stringify(ext_info)
            : null,
          now,
          now,
        ],
      );
      if (videoIds) {
        const ids = videoIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        for (const vid of ids) {
          await db
            .query('UPDATE video SET ad_id = ? WHERE id = ?', [id, vid])
            .catch(() => {});
        }
      }
      res.json({ code: 200, data: { ad_id: id, message: '广告创建成功' } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ code: 500, message: '创建广告失败' });
    }
  });
};
