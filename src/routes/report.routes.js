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

// POST routes with multer middleware for media upload
router.post('/', upload.single('media'), handleMulterError, createReport);
router.post('/emergency', upload.single('media'), handleMulterError, (req, res, next) => {
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
