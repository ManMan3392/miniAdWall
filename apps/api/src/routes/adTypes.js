const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, type_code, type_name FROM ad_type WHERE status=1 ORDER BY id',
    );
    res.json({ code: 200, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 500, message: '查询广告类型失败' });
  }
});

router.post('/', async (req, res) => {
  const { type_code, type_name } = req.body;
  if (!type_code || !type_name) {
    return res.status(400).json({ code: 400, message: '参数不完整' });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO ad_type (type_code, type_name, status) VALUES (?, ?, 1)',
      [type_code, type_name],
    );
    res.json({
      code: 200,
      message: '创建成功',
      data: { id: result.insertId, type_code, type_name },
    });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ code: 400, message: '类型编码已存在' });
    }
    res.status(500).json({ code: 500, message: '创建失败' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { type_code, type_name } = req.body;
  if (!type_code || !type_name) {
    return res.status(400).json({ code: 400, message: '参数不完整' });
  }
  try {
    await db.query('UPDATE ad_type SET type_code=?, type_name=? WHERE id=?', [
      type_code,
      type_name,
      id,
    ]);
    res.json({ code: 200, message: '更新成功' });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ code: 400, message: '类型编码已存在' });
    }
    res.status(500).json({ code: 500, message: '更新失败' });
  }
});

// DELETE /api/ad-types/:id - hard delete type and related form_config
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ code: 400, message: 'id required' });
  try {
    // remove form_config rows that reference this type_id
    await db.query('DELETE FROM form_config WHERE type_id = ?', [id]);

    // delete the ad_type row
    const [result] = await db.query('DELETE FROM ad_type WHERE id = ?', [id]);
    if (result && result.affectedRows === 0) {
      return res.status(404).json({ code: 404, message: 'Type not found' });
    }
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error('删除广告类型失败', err);
    res.status(500).json({ code: 500, message: '删除失败' });
  }
});

module.exports = router;
