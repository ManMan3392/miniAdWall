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
      res.json({ code: 200, data: { adId, message: '更新成功' } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ code: 500, message: '更新失败' });
    }
  });
};
