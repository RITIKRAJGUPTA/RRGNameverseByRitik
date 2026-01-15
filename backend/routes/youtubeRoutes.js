const express = require('express');
const router = express.Router();
const { searchYoutube } = require('../controllers/youtubeController');

/**
 * GET /api/youtube/search?q=world%20affairs
 */
router.get('/search', searchYoutube);

module.exports = router;