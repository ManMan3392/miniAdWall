const db = require('../../db');
const moment = require('moment');

module.exports = (router) => {
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
};
