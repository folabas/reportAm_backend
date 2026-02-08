const Admin = require('../models/admin.model');
const jwt = require('jsonwebtoken');

// @desc    Admin login
// @route   POST /api/admin/auth/login
// @access  Public
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (admin && (await admin.comparePassword(password))) {
        res.json({
            token: jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
                expiresIn: '30d'
            })
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Get admin profile
// @route   GET /api/admin/auth/me
// @access  Private/Admin
const getAdminProfile = async (req, res) => {
    res.json(req.admin);
};

module.exports = {
    loginAdmin,
    getAdminProfile
};
