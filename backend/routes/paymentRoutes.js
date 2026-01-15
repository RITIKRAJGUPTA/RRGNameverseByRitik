const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/paymentController');

// Create Order
router.post('/create-order', createOrder);

// Verify Payment
router.post('/verify-payment', verifyPayment);

module.exports = router;
