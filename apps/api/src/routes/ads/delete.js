const db = require('../../db');

module.exports = (router) => {
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
};
