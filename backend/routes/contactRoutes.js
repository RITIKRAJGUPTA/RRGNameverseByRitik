const express = require('express');
const router = express.Router();
const { submitContact, getContacts } = require('../controllers/contactController');

// POST /api/contact/submit
router.post('/submit', submitContact);

// Optional: GET all contacts (for admin)
router.get('/all', getContacts);

module.exports = router;
