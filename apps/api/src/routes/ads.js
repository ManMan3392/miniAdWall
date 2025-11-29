const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

/**
 * POST /api/ads
 * body: { publisher, title, content, price, landing_url, type_id, video_ids (comma separated), ext_info (json) }
 * Assumption: videos already uploaded via /api/videos/upload, provide their ids.
 * Required base fields: publisher, title, content, price, landing_url
 * Note: heat is auto-set to 0 and not editable
 */
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
    // 依据表单配置进行类型化校验（如果有配置）
    try {
      // 查找类型与配置
      const [typeRows] = await db.query(
        'SELECT type_code FROM ad_type WHERE id = ? LIMIT 1',
        [type_id],
      );
      const type_code = typeRows && typeRows[0] ? typeRows[0].type_code : null;
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

        // 校验必填字段（优先在 ext_info 中校验，否则尝试顶层字段）
        // ext_info 可能是对象（JSON body）或字符串
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
              // 针对 video-upload 特例：允许从 video_ids 映射
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

        // 如果配置包含 video-upload，但未显式 required，也做一次兜底校验：如存在该字段则至少需要一个视频
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
      // 配置异常不应导致进程失败，但要给出友好错误
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
        0, // heat 始终从0开始，不可编辑
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
    // attach uploaded videos to this ad in video table (if any)
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

/**
 * GET /api/ads?page=1&size=10
 * returns paginated list, sorted according to type's sort_rule (basic implementation)
 */
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const size = Math.max(1, parseInt(req.query.size) || 10);
    const offset = (page - 1) * size;

    // join with ad_type to get sort_rule
    // 排序公式: 出价 + (出价 * 热度 * 0.42)
    // 即: a.price + (a.price * a.heat * 0.42)
    const [ads] = await db.query(
      `SELECT a.*, t.type_code, t.sort_rule,
              (a.price + (a.price * a.heat * 0.42)) as sort_score
       FROM ad a
       LEFT JOIN ad_type t ON a.type_id = t.id
       ORDER BY sort_score DESC, a.created_at DESC
       LIMIT ? OFFSET ?`,
      [size, offset],
    );

    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM ad');

    // map video_ids to URLs
    for (const row of ads) {
      row.video_urls = [];
      if (row.video_ids) {
        const ids = row.video_ids
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (ids.length) {
          const [videos] = await db.query(
            `SELECT id, file_path FROM video WHERE id IN (${ids.map(() => '?').join(',')})`,
            ids,
          );
          // Convert stored file_path (可能为相对路径) 为完整可访问的 URL
          row.video_urls = videos.map((v) => {
            const p = v.file_path || '';
            if (/^https?:\/\//i.test(p)) return p;
            return `${req.protocol}://${req.get('host')}${p.startsWith('/') ? p : '/' + p}`;
          });
        }
      }
    }

    res.json({ code: 200, data: { page, size, list: ads, total } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '获取广告列表失败' });
  }
});

/**
 * PUT /api/ads/:id/price
 * body: { price, type_id (optional) }
 * Updates price and returns minimal movement info by recalculating order for the ad's type.
 */
router.put('/:id/price', async (req, res) => {
  const adId = req.params.id;
  const { price } = req.body;
  if (typeof price === 'undefined')
    return res.status(400).json({ code: 400, message: 'price required' });

  try {
    // get current ad
    const [curRows] = await db.query(
      'SELECT id, type_id, price FROM ad WHERE id = ? LIMIT 1',
      [adId],
    );
    if (!curRows.length)
      return res.status(404).json({ code: 404, message: '广告不存在' });
    const curAd = curRows[0];
    const typeId = curAd.type_id;

    // get ordering rule from ad_type
    const [typeRows] = await db.query(
      'SELECT sort_rule FROM ad_type WHERE id = ? LIMIT 1',
      [typeId],
    );
    // sort_rule 可能已被 mysql2 自动解析为对象，或仍为字符串
    let sortRule = null;
    if (typeRows[0] && typeRows[0].sort_rule) {
      const sr = typeRows[0].sort_rule;
      sortRule = typeof sr === 'string' ? JSON.parse(sr) : sr;
    }

    // get old ordered list for this type (only ids)
    // 使用新的排序公式: price + (price * heat * 0.42)
    const [oldListRows] = await db.query(
      `SELECT id FROM ad a 
       WHERE a.type_id = ? 
       ORDER BY (a.price + (a.price * a.heat * 0.42)) DESC, a.created_at DESC`,
      [typeId],
    );
    const oldIds = oldListRows.map((r) => r.id);
    const oldIndex = oldIds.indexOf(adId);

    // update price
    await db.query('UPDATE ad SET price = ?, updated_at = ? WHERE id = ?', [
      price,
      moment().format('YYYY-MM-DD HH:mm:ss'),
      adId,
    ]);

    // recompute new order
    const [newListRows] = await db.query(
      `SELECT id FROM ad a 
       WHERE a.type_id = ? 
       ORDER BY (a.price + (a.price * a.heat * 0.42)) DESC, a.created_at DESC`,
      [typeId],
    );
    const newIds = newListRows.map((r) => r.id);
    const newIndex = newIds.indexOf(adId);

    // compute affected neighbor ad ids (minimal)
    const affected = [];
    if (newIndex !== -1) {
      // collect neighbor ids around newIndex (previous and next)
      if (newIndex - 1 >= 0) affected.push(newIds[newIndex - 1]);
      if (newIndex + 1 < newIds.length) affected.push(newIds[newIndex + 1]);
    }

    res.json({
      code: 200,
      data: {
        adId,
        oldIndex,
        newIndex,
        affectedAdIds: affected,
        message: `出价更新成功，位置变化 ${oldIndex === -1 || newIndex === -1 ? '未知' : oldIndex - newIndex}`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '更新出价失败' });
  }
});

/**
 * PUT /api/ads/:id
 * Basic partial update for ad fields (publisher, title, content, price, landing_url, ext_info, video_ids)
 * Note: heat is not updatable via this endpoint (only via increment-heat)
 */
router.put('/:id', async (req, res) => {
  const adId = req.params.id;
  const fields = {};
  [
    'publisher',
    'title',
    'content',
    'price',
    'landing_url',
    'ext_info',
    'video_ids',
  ].forEach((k) => {
    if (k in req.body) fields[k] = req.body[k];
  });
  if (!Object.keys(fields).length)
    return res.status(400).json({ code: 400, message: '无更新字段' });

  const sets = [];
  const vals = [];
  for (const k of Object.keys(fields)) {
    if (k === 'ext_info') {
      sets.push(`${k} = ?`);
      vals.push(JSON.stringify(fields[k]));
    } else if (k === 'video_ids') {
      // 处理 video_ids：如果是数组则转为逗号分隔字符串
      sets.push(`${k} = ?`);
      const videoIds = Array.isArray(fields[k])
        ? fields[k].join(',')
        : fields[k] || '';
      vals.push(videoIds);
    } else {
      sets.push(`${k} = ?`);
      vals.push(fields[k]);
    }
  }
  vals.push(moment().format('YYYY-MM-DD HH:mm:ss'));
  const setSQL = sets.join(', ') + ', updated_at = ?';
  vals.push(adId);

  try {
    await db.query(`UPDATE ad SET ${setSQL} WHERE id = ?`, vals);
    res.json({ code: 200, data: { adId, message: '更新成功' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '更新失败' });
  }
});

/**
 * POST /api/ads/:id/copy
 * 复制广告时，热度重置为0
 */
router.post('/:id/copy', async (req, res) => {
  const srcId = req.params.id;
  try {
    const [rows] = await db.query('SELECT * FROM ad WHERE id = ? LIMIT 1', [
      srcId,
    ]);
    if (!rows.length)
      return res.status(404).json({ code: 404, message: '源广告不存在' });
    const src = rows[0];
    const newId = uuidv4();
    const title = `${src.title}（副本）`;
    const now = moment().format('YYYY-MM-DD HH:mm:ss');
    await db.query(
      'INSERT INTO ad (id, type_id, publisher, title, content, heat, price, landing_url, video_ids, ext_info, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newId,
        src.type_id,
        src.publisher,
        title,
        src.content,
        0, // 复制的广告热度重置为0
        src.price,
        src.landing_url,
        src.video_ids,
        src.ext_info,
        now,
        now,
      ],
    );
    res.json({ code: 200, data: { ad_id: newId, message: '复制成功' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '复制失败' });
  }
});

/**
 * POST /api/ads/:id/increment-heat
 * 增加广告热度+1（用户点击跳转时调用）
 */
router.post('/:id/increment-heat', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query(
      'UPDATE ad SET heat = heat + 1, updated_at = ? WHERE id = ?',
      [moment().format('YYYY-MM-DD HH:mm:ss'), id],
    );
    res.json({ code: 200, data: { message: '热度已增加' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '热度增加失败' });
  }
});

/**
 * DELETE /api/ads/:id
 * deletes ad and clears video.ad_id (keeps file for simplicity)
 */
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await db.query('DELETE FROM ad WHERE id = ?', [id]);
    await db.query('UPDATE video SET ad_id = NULL WHERE ad_id = ?', [id]);
    res.json({ code: 200, data: { message: '删除成功' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

module.exports = router;
