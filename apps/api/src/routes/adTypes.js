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

module.exports = router;
