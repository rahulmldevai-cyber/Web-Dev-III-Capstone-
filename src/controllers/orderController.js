
const mongoose = require('mongoose');

const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const eventEmitter = require('../utils/eventEmitter');

// Place New Order From Cart
const placeOrder = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        const {
            recipientName,
            phone,
            addressLine,
            city,
            state,
            postalCode,
            country
        } = req.body.deliveryDetails || {};

        if (
            !recipientName ||
            !phone ||
            !addressLine ||
            !city ||
            !state ||
            !postalCode
        ) {
            return res.status(400).json({
                success: false,
                message: 'All delivery details are required'
            });
        }

        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must contain 10 digits'
            });
        }

        let createdOrder;
        const lowStockEvents = [];

        await session.withTransaction(async () => {
            const cart = await Cart.findOne({
                user: req.user.id
            }).session(session);

            if (!cart || cart.items.length === 0) {
                throw new Error('Cart is empty');
            }

            const quantities = new Map();

            for (const item of cart.items) {
                const productId = item.product.toString();

                quantities.set(
                    productId,
                    (quantities.get(productId) || 0) + item.quantity
                );
            }

            const orderProducts = [];
            let totalAmount = 0;

            for (const [productId, quantity] of quantities) {
                const product = await Product.findById(productId)
                    .session(session);

                if (!product) {
                    throw new Error('A product in your cart no longer exists');
                }

                const previousStock = product.stock;

                const updatedProduct = await Product.findOneAndUpdate(
                    {
                        _id: productId,
                        stock: { $gte: quantity }
                    },
                    {
                        $inc: { stock: -quantity }
                    },
                    {
                        new: true,
                        session,
                        runValidators: true
                    }
                );

                if (!updatedProduct) {
                    throw new Error(
                        `Insufficient stock for ${product.name}`
                    );
                }

                const price = product.price;
                const subtotal = price * quantity;

                totalAmount += subtotal;

                orderProducts.push({
                    product: product._id,
                    seller: product.seller,
                    quantity,
                    price
                });

                if (
                    previousStock > product.lowStockThreshold &&
                    updatedProduct.stock <= product.lowStockThreshold
                ) {
                    lowStockEvents.push({
                        productId: product._id,
                        productName: product.name,
                        sellerId: product.seller.toString(),
                        stock: updatedProduct.stock
                    });
                }
            }

            const orderData = {
                customer: req.user.id,
                products: orderProducts,
                deliveryDetails: {
                    recipientName,
                    phone,
                    addressLine,
                    city,
                    state,
                    postalCode,
                    country: country || 'India'
                },
                totalAmount,
                status: 'pending',
                paymentStatus: 'pending'
            };

            const orders = await Order.create(
                [orderData],
                { session }
            );

            createdOrder = orders[0];

            cart.items = [];
            await cart.save({ session });
        });

        eventEmitter.emit('order-placed', {
            orderId: createdOrder._id,
            customerId: req.user.id,
            totalAmount: createdOrder.totalAmount,
            sellerIds: [
                ...new Set(
                    createdOrder.products.map(
                        item => item.seller.toString()
                    )
                )
            ]
        });

        for (const data of lowStockEvents) {
            eventEmitter.emit('low-stock', data);
        }

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order: createdOrder
        });
    } catch (error) {
        next(error);
    } finally {
        await session.endSession();
    }
};

// Get My Orders
const getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({
            customer: req.user.id
        })
            .populate('products.product', 'name price')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        next(error);
    }
};

// Get Seller Orders
const getSellerOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({
            'products.seller': req.user.id
        })
            .populate('customer', 'name email')
            .populate('products.product', 'name price')
            .sort({ createdAt: -1 });

        // Only show orders containing exclusively this seller's products
        const sellerOrders = orders.filter(order =>
            order.products.length > 0 &&
            order.products.every(
                item => item.seller.toString() === req.user.id
            )
        );

        res.status(200).json({
            success: true,
            count: sellerOrders.length,
            orders: sellerOrders
        });

    } catch (error) {
        next(error);
    }
};

// Get Single Order
const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID'
            });
        }

        const order = await Order.findById(id)
            .populate('customer', 'name email')
            .populate('products.product', 'name price');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const isCustomer =
            order.customer._id.toString() === req.user.id;

        const isAdmin = req.user.role === 'admin';

        const isSeller = order.products.some(
            item => item.seller.toString() === req.user.id
        );

        if (!isCustomer && !isAdmin && !isSeller) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        next(error);
    }
};

// Cancel Order
const cancelOrder = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID'
            });
        }

        let cancelledOrder;

        await session.withTransaction(async () => {
            const order = await Order.findOne({
                _id: id,
                customer: req.user.id
            }).session(session);

            if (!order) {
                throw new Error('Order not found');
            }

            if (order.status !== 'pending') {
                throw new Error(
                    'Only pending orders can be cancelled'
                );
            }

            for (const item of order.products) {
                await Product.updateOne(
                    { _id: item.product },
                    { $inc: { stock: item.quantity } },
                    { session }
                );
            }

            order.status = 'cancelled';

            if (order.paymentStatus === 'paid') {
                order.paymentStatus = 'refunded';
            }

            cancelledOrder = await order.save({ session });
        });

        eventEmitter.emit('order-status-updated', {
            orderId: cancelledOrder._id,
            customerId: req.user.id,
            status: 'cancelled'
        });

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            order: cancelledOrder
        });
    } catch (error) {
        next(error);
    } finally {
        await session.endSession();
    }
};

// Update Order Status
const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID'
            });
        }

        const allowedStatuses = [
            'confirmed',
            'shipped',
            'delivered'
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order status'
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (req.user.role === 'seller') {
            const ownsAllProducts = order.products.every(
                item => item.seller.toString() === req.user.id
            );

            if (!ownsAllProducts) {
                return res.status(403).json({
                    success: false,
                    message: 'You cannot update this order'
                });
            }
        }

        const validTransitions = {
            pending: 'confirmed',
            confirmed: 'shipped',
            shipped: 'delivered'
        };

        if (validTransitions[order.status] !== status) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order status transition'
            });
        }

        const updatedOrder = await Order.findOneAndUpdate(
            {
                _id: id,
                status: order.status
            },
            {
                $set: { status }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedOrder) {
            return res.status(409).json({
                success: false,
                message: 'Order status was changed. Please try again.'
            });
        }

        eventEmitter.emit('order-status-updated', {
            orderId: updatedOrder._id,
            customerId: updatedOrder.customer.toString(),
            status: updatedOrder.status
        });

        res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            order: updatedOrder
        });
    } catch (error) {
        next(error);
    }
};

// Simulated Payment
const processPayment = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID'
            });
        }

        const order = await Order.findOneAndUpdate(
            {
                _id: id,
                customer: req.user.id,
                paymentStatus: 'pending',
                status: { $ne: 'cancelled' }
            },
            {
                $set: { paymentStatus: 'paid' }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!order) {
            const existingOrder = await Order.findOne({
                _id: id,
                customer: req.user.id
            });

            if (!existingOrder) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }

            return res.status(400).json({
                success: false,
                message: 'Order is cancelled or payment has already been processed'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Payment successful (simulated)',
            payment: {
                orderId: order._id,
                amount: order.totalAmount,
                paymentStatus: order.paymentStatus
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    placeOrder,
    getMyOrders,
    getSellerOrders,
    getOrderById,
    cancelOrder,
    updateOrderStatus,
    processPayment
};
