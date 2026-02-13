const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');

// Post a comment to a report
// Body: { content, author_name, fingerprint, parent_id? }
router.post('/:report_id/comments', commentController.addComment);

// Get all comments for a report (nested structure)
router.get('/:report_id/comments', commentController.getCommentsForReport);

module.exports = router;
