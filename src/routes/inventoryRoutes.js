
const express = require('express');
const router = express.Router();

const {
    getInventory,
    updateStock,
    getLowStockProducts
} = require('../controllers/inventoryController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('seller', 'admin'));

router.get('/low-stock', getLowStockProducts);
router.get('/', getInventory);
router.patch('/:id/stock', updateStock);

module.exports = router;
