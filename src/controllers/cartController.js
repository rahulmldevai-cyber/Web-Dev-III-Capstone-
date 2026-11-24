
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Calculate Cart Totals
const calculateCartTotals = (cart) => {
    let totalItems = 0;
    let totalAmount = 0;

    const items = cart.items.map((item) => {
        const product = item.product;

        if (!product) {
            return null;
        }

        const subtotal = product.price * item.quantity;

        totalItems += item.quantity;
        totalAmount += subtotal;

        return {
            _id: item._id,
            product: {
                _id: product._id,
                name: product.name,
                price: product.price,
                stock: product.stock
            },
            quantity: item.quantity,
            subtotal
        };
    }).filter(Boolean);

    return {
        items,
        totalItems,
        totalAmount: Number(totalAmount.toFixed(2))
    };
};

// Get Cart
const getCart = async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id })
            .populate('items.product', 'name price stock');

        if (!cart) {
            return res.status(200).json({
                success: true,
                cart: {
                    items: [],
                    totalItems: 0,
                    totalAmount: 0
                }
            });
        }

        res.status(200).json({
            success: true,
            cart: calculateCartTotals(cart)
        });
    } catch (error) {
        next(error);
    }
};

// Add Product To Cart
const addToCart = async (req, res, next) => {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        if (!Number.isSafeInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be a positive whole number'
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            cart = new Cart({
                user: req.user.id,
                items: []
            });
        }

        const existingItem = cart.items.find(
            (item) => item.product.toString() === productId
        );

        const newQuantity = existingItem
            ? existingItem.quantity + quantity
            : quantity;

        if (newQuantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient product stock'
            });
        }

        if (existingItem) {
            existingItem.quantity = newQuantity;
        } else {
            cart.items.push({
                product: productId,
                quantity
            });
        }

        await cart.save();

        cart = await Cart.findById(cart._id)
            .populate('items.product', 'name price stock');

        res.status(200).json({
            success: true,
            message: 'Product added to cart',
            cart: calculateCartTotals(cart)
        });
    } catch (error) {
        next(error);
    }
};

// Update Cart Item Quantity
const updateCart = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        const { itemId } = req.params;

        if (!mongoose.isValidObjectId(itemId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cart item ID'
            });
        }

        if (!Number.isSafeInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be a positive whole number'
            });
        }

        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const item = cart.items.id(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        const product = await Product.findById(item.product);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient product stock'
            });
        }

        item.quantity = quantity;
        await cart.save();

        const updatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'name price stock');

        res.status(200).json({
            success: true,
            message: 'Cart updated successfully',
            cart: calculateCartTotals(updatedCart)
        });
    } catch (error) {
        next(error);
    }
};

// Remove Item From Cart
const removeFromCart = async (req, res, next) => {
    try {
        const { itemId } = req.params;

        if (!mongoose.isValidObjectId(itemId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cart item ID'
            });
        }

        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const item = cart.items.id(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        item.deleteOne();
        await cart.save();

        const updatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'name price stock');

        res.status(200).json({
            success: true,
            message: 'Product removed from cart',
            cart: calculateCartTotals(updatedCart)
        });
    } catch (error) {
        next(error);
    }
};

// Clear Cart
const clearCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(200).json({
                success: true,
                message: 'Cart is already empty'
            });
        }

        cart.items = [];
        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            cart: {
                items: [],
                totalItems: 0,
                totalAmount: 0
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCart,
    removeFromCart,
    clearCart
};
