
const express = require('express');
const router = express.Router();

const {
    getSalesSummary,
    getBestSellingProducts,
    getInventorySummary
} = require('../controllers/reportController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('admin'));

router.get('/sales-summary', getSalesSummary);
router.get('/best-selling-products', getBestSellingProducts);
router.get('/inventory-summary', getInventorySummary);

module.exports = router;
