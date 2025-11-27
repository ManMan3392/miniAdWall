const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const adTypesRouter = require('./routes/adTypes');
const formConfigRouter = require('./routes/formConfig');
const videosRouter = require('./routes/videos');
const adsRouter = require('./routes/ads');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/uploads', express.static('uploads'));

app.use('/api/ad-types', adTypesRouter);
app.use('/api/form-config', formConfigRouter);
app.use('/api/videos', videosRouter);
app.use('/api/ads', adsRouter);

app.get('/api/health', (req, res) => res.json({ code: 200, data: 'ok' }));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`mini-adwall backend listening on port ${port}`);
});
