
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    image: {
        type: String,
        trim: true,
        default: ''
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        validate: {
            validator: Number.isSafeInteger,
            message: 'Stock must be a whole number'
        }
    },
    lowStockThreshold: {
        type: Number,
        default: 5,
        min: 0,
        validate: {
            validator: Number.isSafeInteger,
            message: 'Low stock threshold must be a whole number'
        }
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Database Indexes
productSchema.index({ category: 1, price: 1 });
productSchema.index({ seller: 1, createdAt: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });
productSchema.index({ seller: 1, stock: 1 });

module.exports = mongoose.model('Product', productSchema);
