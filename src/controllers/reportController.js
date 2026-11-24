
const Order = require('../models/Order');
const Product = require('../models/Product');

// Sales Summary Report
const getSalesSummary = async (req, res, next) => {
    try {
        const report = await Order.aggregate([
            {
                $match: {
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' },
                    averageOrderValue: { $avg: '$totalAmount' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalOrders: 1,
                    totalRevenue: { $round: ['$totalRevenue', 2] },
                    averageOrderValue: { $round: ['$averageOrderValue', 2] }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            report: report[0] || {
                totalOrders: 0,
                totalRevenue: 0,
                averageOrderValue: 0
            }
        });
    } catch (error) {
        next(error);
    }
};

// Best Selling Products Report
const getBestSellingProducts = async (req, res, next) => {
    try {
        const products = await Order.aggregate([
            {
                $match: {
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $unwind: '$products'
            },
            {
                $group: {
                    _id: '$products.product',
                    totalQuantitySold: {
                        $sum: '$products.quantity'
                    },
                    totalRevenue: {
                        $sum: {
                            $multiply: [
                                '$products.quantity',
                                '$products.price'
                            ]
                        }
                    }
                }
            },
            {
                $sort: {
                    totalQuantitySold: -1
                }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: {
                    path: '$productDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    productName: {
                        $ifNull: ['$productDetails.name', 'Deleted Product']
                    },
                    totalQuantitySold: 1,
                    totalRevenue: { $round: ['$totalRevenue', 2] }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: products.length,
            products
        });
    } catch (error) {
        next(error);
    }
};

// Inventory Summary Report
const getInventorySummary = async (req, res, next) => {
    try {
        const report = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    totalStockUnits: { $sum: '$stock' },
                    totalInventoryValue: {
                        $sum: {
                            $multiply: ['$price', '$stock']
                        }
                    },
                    lowStockProducts: {
                        $sum: {
                            $cond: [
                                { $lte: ['$stock', '$lowStockThreshold'] },
                                1,
                                0
                            ]
                        }
                    },
                    outOfStockProducts: {
                        $sum: {
                            $cond: [
                                { $eq: ['$stock', 0] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalProducts: 1,
                    totalStockUnits: 1,
                    totalInventoryValue: {
                        $round: ['$totalInventoryValue', 2]
                    },
                    lowStockProducts: 1,
                    outOfStockProducts: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            report: report[0] || {
                totalProducts: 0,
                totalStockUnits: 0,
                totalInventoryValue: 0,
                lowStockProducts: 0,
                outOfStockProducts: 0
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSalesSummary,
    getBestSellingProducts,
    getInventorySummary
};
