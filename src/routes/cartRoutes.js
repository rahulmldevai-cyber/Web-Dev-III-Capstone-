
const express = require('express');
const router = express.Router();

const {
    getCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart
} = require('../controllers/cartController');

const { protect } = require('../middleware/authMiddleware');

// All Cart Routes Require Login
router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.put('/:itemId', protect, updateCart);
router.delete('/clear', protect, clearCart);
router.delete('/:itemId', protect, removeFromCart);

module.exports = router;
