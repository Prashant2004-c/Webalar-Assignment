const express = require('express');
const { getRecentActionss } = require('../controllers/actionLogController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/', getRecentActionss);

module.exports = router;