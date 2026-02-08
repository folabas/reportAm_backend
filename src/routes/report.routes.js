const express = require('express');
const router = express.Router();
const {
    createReport,
    getReports,
    getReportsByCommunity,
    getReportById,
    markAffected,
    removeAffected
} = require('../controllers/report.controller');

router.post('/', createReport);
router.post('/emergency', (req, res, next) => {
    req.body.is_emergency = true;
    next();
}, createReport);

router.get('/', getReports);
router.get('/community/:communityId', getReportsByCommunity);
router.get('/:id', getReportById);

router.post('/:id/affected', markAffected);
router.delete('/:id/affected', removeAffected);

module.exports = router;
