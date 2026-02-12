const express = require('express');
const router = express.Router();
const { upload, handleMulterError } = require('../config/multer.config');
const {
    createReport,
    getReports,
    getReportsByCommunity,
    getReportById,
    markAffected,
    removeAffected
} = require('../controllers/report.controller');

// POST routes with multer middleware for image upload
router.post('/', upload.single('image'), handleMulterError, createReport);
router.post('/emergency', upload.single('image'), handleMulterError, (req, res, next) => {
    req.body.is_emergency = true;
    next();
}, createReport);

// GET routes
router.get('/', getReports);
router.get('/community/:communityId', getReportsByCommunity);
router.get('/:id', getReportById);

// Affected routes
router.post('/:id/affected', markAffected);
router.delete('/:id/affected', removeAffected);

module.exports = router;
