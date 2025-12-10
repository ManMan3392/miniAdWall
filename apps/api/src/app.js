const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const adTypesRouter = require('./routes/adTypes');
const formConfigRouter = require('./routes/formConfig');
const videosRouter = require('./routes/videos');
const adsRouter = require('./routes/ads');

const app = express();

const rawOrigins =
  process.env.FRONTEND_ORIGIN || 'https://mini-ad-wall-web.vercel.app';
const extraLocal = 'http://localhost:5173';
const ALLOWED_ORIGINS = Array.from(
  new Set(
    rawOrigins
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .concat([extraLocal]),
  ),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server or curl
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  '/uploads',
  (req, res, next) => {
    const origin = req.headers.origin;
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }
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
