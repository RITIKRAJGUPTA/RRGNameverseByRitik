const express = require('express');
const router = express.Router();
const { getDailyShlok } = require('../controllers/gitaController');

router.get('/daily-shlok', getDailyShlok);

module.exports = router;
