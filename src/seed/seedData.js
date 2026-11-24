
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../config/db');

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const seedData = async () => {
    try {
        // Check required passwords
        const adminPassword = process.env.SEED_ADMIN_PASSWORD;
        const sellerPassword = process.env.SEED_SELLER_PASSWORD;
        const customerPassword = process.env.SEED_CUSTOMER_PASSWORD;

        if (!adminPassword || !sellerPassword || !customerPassword) {
            throw new Error('Add all three seed passwords to your .env file');
        }

        await connectDB();

        // Hash passwords
        const adminHash = await bcrypt.hash(adminPassword, 12);
        const sellerHash = await bcrypt.hash(sellerPassword, 12);
        const customerHash = await bcrypt.hash(customerPassword, 12);

        // Create or update users
        const admin = await User.findOneAndUpdate(
            { email: 'admin@example.com' },
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: adminHash,
                role: 'admin'
            },
            { upsert: true, new: true, runValidators: true }
        );

        const seller = await User.findOneAndUpdate(
            { email: 'seller@example.com' },
            {
                name: 'Demo Seller',
                email: 'seller@example.com',
                password: sellerHash,
                role: 'seller'
            },
            { upsert: true, new: true, runValidators: true }
        );

        await User.findOneAndUpdate(
            { email: 'customer@example.com' },
            {
                name: 'Demo Customer',
                email: 'customer@example.com',
                password: customerHash,
                role: 'customer'
            },
            { upsert: true, new: true, runValidators: true }
        );

        // Create categories
        const categoryData = [
            {
                name: 'Electronics',
                description: 'Electronic devices and accessories'
            },
            {
                name: 'Clothing',
                description: 'Fashion and clothing products'
            },
            {
                name: 'Home & Kitchen',
                description: 'Home and kitchen essentials'
            }
        ];

        const categories = {};

        for (const data of categoryData) {
            categories[data.name] = await Category.findOneAndUpdate(
                { name: data.name },
                data,
                { upsert: true, new: true, runValidators: true }
            );
        }

        // Create products
        const productData = [
            {
                name: 'Wireless Headphones',
                description: 'Bluetooth wireless headphones',
                price: 1999,
                stock: 25,
                lowStockThreshold: 5,
                category: categories['Electronics']._id,
                seller: seller._id
            },
            {
                name: 'Smart Watch',
                description: 'Smart watch with fitness tracking',
                price: 2999,
                stock: 15,
                lowStockThreshold: 5,
                category: categories['Electronics']._id,
                seller: seller._id
            },
            {
                name: 'Laptop Backpack',
                description: 'Durable backpack for laptops',
                price: 1299,
                stock: 3,
                lowStockThreshold: 5,
                category: categories['Electronics']._id,
                seller: seller._id
            },
            {
                name: 'Cotton T-Shirt',
                description: 'Comfortable cotton T-shirt',
                price: 599,
                stock: 30,
                lowStockThreshold: 5,
                category: categories['Clothing']._id,
                seller: seller._id
            },
            {
                name: 'Kitchen Mixer',
                description: 'Multi-purpose kitchen mixer',
                price: 2499,
                stock: 10,
                lowStockThreshold: 5,
                category: categories['Home & Kitchen']._id,
                seller: seller._id
            }
        ];

        for (const data of productData) {
            await Product.findOneAndUpdate(
                { name: data.name, seller: seller._id },
                data,
                { upsert: true, new: true, runValidators: true }
            );
        }

        console.log('Seed data inserted successfully!');
        console.log('Admin: admin@example.com');
        console.log('Seller: seller@example.com');
        console.log('Customer: customer@example.com');
        console.log('Categories and products created.');

    } catch (error) {
        console.error('Seed error:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seedData();
