const express = require('express');
const router = express.Router();

require('./ads/create')(router);
require('./ads/list')(router);
require('./ads/update')(router);
require('./ads/heat')(router);
require('./ads/delete')(router);

module.exports = router;
