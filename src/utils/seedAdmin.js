const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/admin.model');
const connectDB = require('../config/db');

dotenv.config();

const seedAdmin = async () => {
    await connectDB();

    try {
        await Admin.deleteMany({ email: 'admin@reportam.com' });

        const admin = new Admin({
            email: 'admin@reportam.com',
            password: 'password123' // Will be hashed by pre-save hook
        });

        await admin.save();
        console.log('Admin seeded successfully');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedAdmin();
