
const express = require('express');
const router = express.Router();

const {
    placeOrder,
    getMyOrders,
    getSellerOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus,
    processPayment
} = require('../controllers/orderController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All order routes require authentication
router.use(protect);

// Customer routes
router.post('/', authorize('customer'), placeOrder);
router.get('/my-orders', authorize('customer'), getMyOrders);
router.patch('/:id/cancel', authorize('customer'), cancelOrder);
router.post('/:id/pay', authorize('customer'), processPayment);

// Seller routes
router.get('/seller-orders', authorize('seller'), getSellerOrders);

// Seller and Admin routes
router.patch(
    '/:id/status',
    authorize('seller', 'admin'),
    updateOrderStatus
);

// Get order details
router.get('/:id', getOrderById);

module.exports = router;
