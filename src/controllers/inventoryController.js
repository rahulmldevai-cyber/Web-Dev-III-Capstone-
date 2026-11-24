const mongoose = require('mongoose');
const Product = require('../models/Product');
const eventEmitter = require('../utils/eventEmitter');

// Get Inventory
const getInventory = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, lowStock } = req.query;

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        if (!Number.isInteger(pageNumber) || pageNumber < 1 ||
            !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
            return res.status(400).json({
                success: false,
                message: 'Invalid pagination values'
            });
        }

        const filter = req.user.role === 'admin'
            ? {}
            : { seller: req.user.id };

        if (lowStock === 'true') {
            filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
        }

        const [products, total] = await Promise.all([
            Product.find(filter)
                .populate('category', 'name')
                .sort({ createdAt: -1 })
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize),
            Product.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            total,
            currentPage: pageNumber,
            totalPages: Math.ceil(total / pageSize),
            products
        });
    } catch (error) {
        next(error);
    }
};

// Update Product Stock
const updateStock = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { stock, lowStockThreshold } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        if (
            stock === undefined ||
            !Number.isSafeInteger(stock) ||
            stock < 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Stock must be a non-negative whole number'
            });
        }

        if (
            lowStockThreshold !== undefined &&
            (!Number.isSafeInteger(lowStockThreshold) || lowStockThreshold < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Low stock threshold must be a non-negative whole number'
            });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const previousStock = product.stock;

        if (
            req.user.role !== 'admin' &&
            product.seller.toString() !== req.user.id
        ) {
            return res.status(403).json({
                success: false,
                message: 'You cannot update another seller inventory'
            });
        }

        product.stock = stock;

        if (lowStockThreshold !== undefined) {
            product.lowStockThreshold = lowStockThreshold;
        }

        await product.save();

        if (
    previousStock > product.lowStockThreshold &&
    product.stock <= product.lowStockThreshold
) {
    eventEmitter.emit('low-stock', {
        productId: product._id.toString(),
        productName: product.name,
        stock: product.stock,
        sellerId: product.seller.toString()
    });
}

        res.status(200).json({
            success: true,
            message: 'Inventory updated successfully',
            product
        });
    } catch (error) {
        next(error);
    }
};

// Get Low Stock Products
const getLowStockProducts = async (req, res, next) => {
    try {
        const filter = {
            $expr: { $lte: ['$stock', '$lowStockThreshold'] }
        };

        if (req.user.role !== 'admin') {
            filter.seller = req.user.id;
        }

        const products = await Product.find(filter)
            .populate('category', 'name')
            .populate('seller', 'name email')
            .sort({ stock: 1 });

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getInventory,
    updateStock,
    getLowStockProducts
};
