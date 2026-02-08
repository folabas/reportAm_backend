const express = require('express');
const router = express.Router();
const {
    createCommunityRequest,
    getCommunityRequests,
    approveCommunityRequest,
    rejectCommunityRequest
} = require('../controllers/communityRequest.controller');
const { protect } = require('../middleware/auth.middleware');

// Public route
router.post('/', createCommunityRequest);

// Admin routes (prefixed elsewhere, or handled here)
router.get('/admin', protect, getCommunityRequests);
router.post('/admin/:id/approve', protect, approveCommunityRequest);
router.post('/admin/:id/reject', protect, rejectCommunityRequest);

module.exports = router;
