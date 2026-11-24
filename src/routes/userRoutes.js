
const express = require('express');
const router = express.Router();

const {
    getMyProfile,
    updateMyProfile,
    changePassword,
    getAllUsers,
    updateUserRole
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Admin Routes
router.get('/', protect, authorize('admin'), getAllUsers);
router.patch('/:id/role', protect, authorize('admin'), updateUserRole);

// User Profile Routes
router.get('/me', protect, getMyProfile);
router.patch('/me', protect, updateMyProfile);
router.patch('/change-password', protect, changePassword);

module.exports = router;
