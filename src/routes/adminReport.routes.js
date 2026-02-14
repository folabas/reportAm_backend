const express = require('express');
const router = express.Router();
const {
    getAllReportsAdmin,
    updateReportStatus,
    deleteReport,
    getAdminStats
} = require('../controllers/adminReport.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/stats', getAdminStats);
router.get('/', getAllReportsAdmin);
router.patch('/:id/status', updateReportStatus);
router.delete('/:id', deleteReport);


module.exports = router;
