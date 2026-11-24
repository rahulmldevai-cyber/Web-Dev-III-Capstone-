
require('dotenv').config();

const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');

const {
    initializeSocket
} = require('./src/utils/socket');

require('./src/utils/eventListeners');

const {
    notFound,
    errorHandler
} = require('./src/middleware/errorMiddleware');

const app = express();

// Security Middleware
app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));

// Request Logging
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Body Parser
app.use(express.json({ limit: '10kb' }));

// Authentication Rate Limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests. Please try again later.'
    }
});

// API Routes
app.use('/api/auth', authLimiter, require('./src/routes/authRoutes'));
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/products', require('./src/routes/productRoutes'));
app.use('/api/categories', require('./src/routes/categoryRoutes'));
app.use('/api/cart', require('./src/routes/cartRoutes'));
app.use('/api/orders', require('./src/routes/orderRoutes'));
app.use('/api/reviews', require('./src/routes/reviewRoutes'));
app.use('/api/inventory', require('./src/routes/inventoryRoutes'));
app.use('/api/reports', require('./src/routes/reportRoutes'));

// Home Route
app.get('/', (req, res) => {
    res.send('Smart E-Commerce API is running!');
});

// Error Handling
app.use(notFound);
app.use(errorHandler);

// HTTP + Socket.IO Server
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initializeSocket(server);

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('Socket.IO initialized successfully');
    });
});
