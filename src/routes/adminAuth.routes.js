const express = require('express');
const router = express.Router();
const {
    loginAdmin,
    getAdminProfile
} = require('../controllers/adminAuth.controller');
const { protect } = require('../middleware/auth.middleware');

// @desc    Admin login
// @route   POST /api/admin/auth/login
// @access  Public
router.post('/login', loginAdmin);

// @desc    Get admin profile
// @route   GET /api/admin/auth/me
// @access  Private/Admin
router.get('/me', protect, getAdminProfile);

module.exports = router;
