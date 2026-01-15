const express = require('express');
const router = express.Router();
const { getNameMeaning } = require('../controllers/aiController');

/**
 * POST /api/ai/meaning
 * body: { name: "John" }
 */
router.post('/meaning', getNameMeaning);

module.exports = router;
