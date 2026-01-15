const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');

router.get('/photos', galleryController.getPhotos);

module.exports = router;
