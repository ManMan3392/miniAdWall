const db = require('../../db');

module.exports = (router) => {
  router.get('/', async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const size = Math.max(1, parseInt(req.query.size) || 10);
      const offset = (page - 1) * size;

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
            row.video_urls = videos.map((v) => v.file_path || '');
          }
        }
      }

      res.json({ code: 200, data: { page, size, list: ads, total } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ code: 500, message: '获取广告列表失败' });
    }
  });
};
