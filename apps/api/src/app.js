const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const adTypesRouter = require('./routes/adTypes');
const formConfigRouter = require('./routes/formConfig');
const videosRouter = require('./routes/videos');
const adsRouter = require('./routes/ads');

const app = express();

// 从环境变量读取允许的前端来源，默认使用你的 Vercel 部署地址
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || 'https://mini-ad-wall-web.vercel.app';

// 严格的 CORS 配置：允许没有 Origin（如 server-to-server 请求）或匹配 FRONTEND_ORIGIN 的请求
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server or curl
      if (origin === FRONTEND_ORIGIN) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 为 /uploads 提供静态服务并添加 CORS 头（支持跨域播放视频等）
app.use(
  '/uploads',
  (req, res, next) => {
    res.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Range,Origin,Accept,Content-Type',
    );
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  },
  express.static('uploads'),
);

app.use('/api/ad-types', adTypesRouter);
app.use('/api/form-config', formConfigRouter);
app.use('/api/videos', videosRouter);
app.use('/api/ads', adsRouter);

app.get('/api/health', (req, res) => res.json({ code: 200, data: 'ok' }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`mini-adwall backend listening on port ${port}`);
});
