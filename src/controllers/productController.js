
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Validate Product Data
const validateProductData = (name, description, price, stock) => {
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
        return 'Product name is required';
    }

    if (description !== undefined && (typeof description !== 'string' || !description.trim())) {
        return 'Product description is required';
    }

    if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
        return 'Price must be a valid non-negative number';
    }

    if (stock !== undefined && (!Number.isInteger(stock) || stock < 0)) {
        return 'Stock must be a non-negative integer';
    }

    return null;
};

// Validate Image URL
const validateImageUrl = (image) => {
    if (image === undefined || image === '') {
        return null;
    }

    if (typeof image !== 'string') {
        return 'Image must be a valid URL';
    }

    try {
        const url = new URL(image.trim());

        if (!['http:', 'https:'].includes(url.protocol)) {
            return 'Image URL must use HTTP or HTTPS';
        }
    } catch {
        return 'Please enter a valid image URL';
    }

    return null;
};

// Escape Special Regex Characters
const escapeRegex = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Get All Products
const getProducts = async (req, res, next) => {
    try {
        const {
            search,
            category,
            minPrice,
            maxPrice,
            sort = 'newest',
            page = '1',
            limit = '10'
        } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (
            !Number.isSafeInteger(pageNumber) ||
            pageNumber < 1 ||
            !Number.isSafeInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 100
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid page or limit. Limit must be between 1 and 100'
            });
        }

        const filter = {};

        if (search !== undefined) {
            if (typeof search !== 'string' || !search.trim() || search.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid search value'
                });
            }

            filter.name = {
                $regex: escapeRegex(search.trim()),
                $options: 'i'
            };
        }

        if (category !== undefined) {
            if (!mongoose.isValidObjectId(category)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID'
                });
            }

            filter.category = category;
        }

        if (minPrice !== undefined) {
            const min = Number(minPrice);

            if (minPrice.trim() === '' || !Number.isFinite(min) || min < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid minimum price'
                });
            }

            filter.price = { ...filter.price, $gte: min };
        }

        if (maxPrice !== undefined) {
            const max = Number(maxPrice);

            if (maxPrice.trim() === '' || !Number.isFinite(max) || max < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid maximum price'
                });
            }

            filter.price = { ...filter.price, $lte: max };
        }

        if (
            filter.price?.$gte !== undefined &&
            filter.price?.$lte !== undefined &&
            filter.price.$gte > filter.price.$lte
        ) {
            return res.status(400).json({
                success: false,
                message: 'Minimum price cannot exceed maximum price'
            });
        }

        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            price_asc: { price: 1 },
            price_desc: { price: -1 }
        };

        if (!sortOptions[sort]) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sort option'
            });
        }

        const skip = (pageNumber - 1) * limitNumber;

        const [products, totalProducts] = await Promise.all([
            Product.find(filter)
                .populate('seller', 'name')
                .populate('category', 'name description')
                .sort(sortOptions[sort])
                .skip(skip)
                .limit(limitNumber),

            Product.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            count: products.length,
            totalProducts,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalProducts / limitNumber),
            products
        });

    } catch (error) {
        next(error);
    }
};

// Get Single Product
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        const product = await Product.findById(id)
            .populate('seller', 'name')
            .populate('category', 'name description');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        next(error);
    }
};

// Create Product
const createProduct = async (req, res, next) => {
    try {
        const {
            name,
            description,
            price,
            image = '',
            stock,
            lowStockThreshold = 5,
            category
        } = req.body;

        if (
            typeof name !== 'string' ||
            typeof description !== 'string' ||
            typeof price !== 'number'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Name, description and price are required'
            });
        }

        const validationError = validateProductData(
            name, description, price, stock
        );

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const imageError = validateImageUrl(image);

        if (imageError) {
            return res.status(400).json({
                success: false,
                message: imageError
            });
        }

        if (
            !Number.isSafeInteger(lowStockThreshold) ||
            lowStockThreshold < 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Low stock threshold must be a non-negative whole number'
            });
        }

        if (!mongoose.isValidObjectId(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }

        const existingCategory = await Category.findById(category);

        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        const product = await Product.create({
            name: name.trim(),
            description: description.trim(),
            price,
            image: image.trim(),
            stock: stock === undefined ? 0 : stock,
            lowStockThreshold,
            category,
            seller: req.user.id
        });

        await product.populate([
            { path: 'seller', select: 'name email' },
            { path: 'category', select: 'name description' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product
        });

    } catch (error) {
        next(error);
    }
};

// Update Product
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Verify Product Ownership
        if (
            product.seller.toString() !== req.user.id &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this product'
            });
        }

        const {
            name,
            description,
            price,
            image,
            stock,
            lowStockThreshold,
            category
        } = req.body;

        const allowedFields = [
            'name',
            'description',
            'price',
            'image',
            'stock',
            'lowStockThreshold',
            'category'
        ];

        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No update data provided'
            });
        }

        if (Object.keys(req.body).some(
            field => !allowedFields.includes(field)
        )) {
            return res.status(400).json({
                success: false,
                message: 'Invalid update field'
            });
        }

        const validationError = validateProductData(
            name, description, price, stock
        );

        if (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError
            });
        }

        const imageError = validateImageUrl(image);

        if (imageError) {
            return res.status(400).json({
                success: false,
                message: imageError
            });
        }

        if (
            lowStockThreshold !== undefined &&
            (!Number.isSafeInteger(lowStockThreshold) ||
                lowStockThreshold < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Low stock threshold must be a non-negative whole number'
            });
        }

        const updateData = {};

        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (price !== undefined) updateData.price = price;
        if (image !== undefined) updateData.image = image.trim();
        if (stock !== undefined) updateData.stock = stock;

        if (lowStockThreshold !== undefined) {
            updateData.lowStockThreshold = lowStockThreshold;
        }

        if (category !== undefined) {
            if (!mongoose.isValidObjectId(category)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID'
                });
            }

            const existingCategory = await Category.findById(category);

            if (!existingCategory) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            updateData.category = category;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('seller', 'name email')
            .populate('category', 'name description');

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product: updatedProduct
        });

    } catch (error) {
        next(error);
    }
};

// Delete Product
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID'
            });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Verify Product Ownership
        if (
            product.seller.toString() !== req.user.id &&
            req.user.role !== 'admin'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this product'
            });
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
