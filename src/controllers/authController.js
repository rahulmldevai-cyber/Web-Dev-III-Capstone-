
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Hash Refresh Token
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Generate Access Token
const generateAccessToken = (id, role) => {
    return jwt.sign(
        { id: id.toString(), role, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
    return jwt.sign(
        { id: id.toString(), type: 'refresh' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
};

// Generate Both Tokens
const generateTokens = async (user) => {
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    return { accessToken, refreshToken };
};

// Register User
const registerUser = async (req, res, next) => {
    try {
        let { name, email, password } = req.body;

        if (
            typeof name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        name = name.trim();
        email = email.trim().toLowerCase();

        if (!name || !email.includes('@') || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Enter valid details. Password must be at least 8 characters'
            });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: 'customer'
        });

        const tokens = await generateTokens(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            ...tokens,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        next(error);
    }
};

// Login User
const loginUser = async (req, res, next) => {
    try {
        let { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        email = email.trim().toLowerCase();

        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const tokens = await generateTokens(user);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            ...tokens,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
};

// Refresh Access Token
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET
        );

        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        const user = await User.findById(decoded.id)
            .select('+refreshTokenHash');

        if (
            !user ||
            !user.refreshTokenHash ||
            user.refreshTokenHash !== hashToken(token)
        ) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired or invalid'
            });
        }

        const tokens = await generateTokens(user);

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            ...tokens
        });

    } catch (error) {
        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError'
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        next(error);
    }
};

// Logout User
const logoutUser = async (req, res, next) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET
        );

        if (decoded.type !== 'refresh') {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }

        const user = await User.findById(decoded.id)
            .select('+refreshTokenHash');

        if (
            !user ||
            !user.refreshTokenHash ||
            user.refreshTokenHash !== hashToken(token)
        ) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token already invalid'
            });
        }

        user.refreshTokenHash = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        if (
            error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError'
        ) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }

        next(error);
    }
};

module.exports = {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser
};
