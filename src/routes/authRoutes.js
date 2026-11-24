
const express = require('express');
const router = express.Router();

const {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser
} = require('../controllers/authController');

// Register
router.post('/register', registerUser);

// Login
router.post('/login', loginUser);

// Refresh Access Token
router.post('/refresh', refreshToken);

// Logout
router.post('/logout', logoutUser);

module.exports = router;
