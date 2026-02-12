const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');

dotenv.config();

const app = express();

// Trust proxy (required for Render)
app.set('trust proxy', 1);

// CORS Configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Welcome Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to ReportAm API' });
});

// Routes
app.use('/api/admin/auth', require('./routes/adminAuth.routes.js'));
app.use('/api/locations', require('./routes/location.routes.js'));
app.use('/api/community-requests', require('./routes/communityRequest.routes.js'));
app.use('/api/reports', require('./routes/report.routes.js'));
app.use('/api/admin/reports', require('./routes/adminReport.routes.js'));
app.use('/api/uploads', require('./routes/upload.routes.js'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors
        });
    }

    // Handle Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({
            message: 'Invalid ID format'
        });
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
        return res.status(400).json({
            message: 'Duplicate entry found'
        });
    }

    // Default error response
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

module.exports = app;
