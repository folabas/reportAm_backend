const express = require('express');
const router = express.Router();
const {
    getAllReportsAdmin,
    updateReportStatus
} = require('../controllers/adminReport.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', getAllReportsAdmin);
router.patch('/:id/status', updateReportStatus);

module.exports = router;
