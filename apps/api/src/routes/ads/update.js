const db = require('../../db');
const moment = require('moment');

module.exports = (router) => {
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

      const [[rows]] = await db.query(
        `SELECT a.*, t.type_code, t.sort_rule
         FROM ad a
         LEFT JOIN ad_type t ON a.type_id = t.id
         WHERE a.id = ?`,
        [adId],
      );

      if (!rows) {
        return res.status(404).json({ code: 404, message: '广告不存在' });
      }

      const ad = rows;

      try {
        ad.ext_info = ad.ext_info ? JSON.parse(ad.ext_info) : {};
      } catch (e) {
        ad.ext_info = ad.ext_info || {};
      }

      ad.video_urls = [];
      if (ad.video_ids) {
        const ids = ad.video_ids
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (ids.length) {
          const [videos] = await db.query(
            `SELECT id, file_path FROM video WHERE id IN (${ids
              .map(() => '?')
              .join(',')})`,
            ids,
          );
          ad.video_urls = videos.map((v) => v.file_path || '');
        }
      }

      res.json({ code: 200, data: ad });
    } catch (err) {
      console.error(err);
      res.status(500).json({ code: 500, message: '更新失败' });
    }
  });
};
