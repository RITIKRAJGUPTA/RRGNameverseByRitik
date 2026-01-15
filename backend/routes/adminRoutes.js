const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Admin login
router.post('/login', adminController.login);

// Upload media to Cloudinary (protected route)
router.post('/upload', auth, adminController.uploadMedia);

// Logout
router.post('/logout', auth, adminController.logout);

module.exports = router;
