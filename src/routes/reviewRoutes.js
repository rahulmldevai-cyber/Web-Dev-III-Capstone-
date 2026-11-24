
const express = require('express');
const router = express.Router();

const {
    getProductReviews,
    createReview,
    deleteReview
} = require('../controllers/reviewController');

const { protect } = require('../middleware/authMiddleware');

// Public Route
router.get('/product/:productId', getProductReviews);

// Protected Routes
router.post('/product/:productId', protect, createReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
