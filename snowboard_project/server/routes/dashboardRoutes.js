'use strict';
const express     = require('express');
const router      = express.Router();
const auth        = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboardController');

router.get('/', auth(['admin', 'manager', 'user']), getDashboard);

module.exports = router;
