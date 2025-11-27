const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const UP_DIR = path.join(__dirname, '..', '..', 'uploads', 'videos');
if (!fs.existsSync(UP_DIR)) fs.mkdirSync(UP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UP_DIR),
  filename: (_, file, cb) =>
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 1024 * 1024 * 1024 } });

router.post('/upload', upload.single('video'), async (req, res) => {
  const file = req.file;
  const type_id = req.body.type_id;
  if (!file)
    return res
      .status(400)
      .json({ code: 400, message: '视频文件未上传，请使用字段名 video' });

  const rulesByType = {
    short_video: {
      min: 5,
      max: 60,
      maxSize: 100 * 1024 * 1024,
      allowed: ['.mp4'],
    },
    brand: {
      min: 15,
      max: 120,
      maxSize: 200 * 1024 * 1024,
      allowed: ['.mp4', '.avi'],
    },
    effect: { min: 10, max: 90, maxSize: 150 * 1024 * 1024, allowed: ['.mp4'] },
  };

  let type_code = null;
  try {
    if (type_id) {
      const [rows] = await db.query(
        'SELECT type_code FROM ad_type WHERE id = ? LIMIT 1',
        [type_id],
      );
      if (rows && rows.length) type_code = rows[0].type_code;
    }
  } catch (e) {
    console.warn('type lookup failed', e);
  }

  const filepath = file.path;

  // 尝试使用 ffprobe 获取视频元数据，如果失败则使用默认值
  let duration = 0;
  let width = 0;
  let height = 0;
  let resolution = '';
  let previewUrl = null;

  try {
    // 检查 ffprobe 是否可用
    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filepath, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const format = metadata.format || {};
    const streams = metadata.streams || [];
    const vstream = streams.find((s) => s.codec_type === 'video') || {};
    duration = Math.floor(format.duration || 0);
    width = vstream.width || 0;
    height = vstream.height || 0;
    resolution = width && height ? `${width}x${height}` : '';

    // 尝试生成预览图
    const previewDir = path.join(__dirname, '..', '..', 'uploads', 'previews');
    if (!fs.existsSync(previewDir))
      fs.mkdirSync(previewDir, { recursive: true });
    const previewFilename = `${uuidv4()}.jpg`;

    await new Promise((resolve, reject) => {
      ffmpeg(filepath)
        .screenshots({
          count: 1,
          timemarks: ['00:00:01'],
          size: '480x?',
          filename: previewFilename,
          folder: previewDir,
        })
        .on('end', resolve)
        .on('error', reject);
    });

    previewUrl = `${req.protocol}://${req.get('host')}/uploads/previews/${previewFilename}`;
  } catch (err) {
    console.warn('FFmpeg 不可用或视频处理失败，将使用默认值:', err.message);
    // 继续处理，使用默认值
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const rules = type_code ? rulesByType[type_code] : null;
  if (rules) {
    if (file.size > rules.maxSize) {
      fs.unlinkSync(filepath);
      return res.status(400).json({
        code: 400,
        message: `文件过大，最大允许 ${rules.maxSize} 字节`,
      });
    }
    if (!rules.allowed.includes(ext)) {
      fs.unlinkSync(filepath);
      return res
        .status(400)
        .json({ code: 400, message: `不支持的文件格式 ${ext}` });
    }
    if (duration > 0 && (duration < rules.min || duration > rules.max)) {
      fs.unlinkSync(filepath);
      return res.status(400).json({
        code: 400,
        message: `视频时长需在 ${rules.min}-${rules.max} 秒之间`,
      });
    }
  }

  const vid = uuidv4();
  try {
    await db.query(
      'INSERT INTO video (id, ad_id, file_name, file_path, file_size, file_type, duration, resolution) VALUES (?, NULL, ?, ?, ?, ?, ?, ?)',
      [
        vid,
        file.originalname,
        `/uploads/videos/${path.basename(filepath)}`,
        file.size,
        file.mimetype,
        duration,
        resolution,
      ],
    );
  } catch (e) {
    console.error('db insert video failed', e);
    return res.status(500).json({ code: 500, message: '数据库保存失败' });
  }

  res.json({
    code: 200,
    data: {
      videoId: vid,
      url: `${req.protocol}://${req.get('host')}/uploads/videos/${path.basename(filepath)}`,
      duration,
      resolution,
      previewUrl,
    },
  });
});

module.exports = router;
