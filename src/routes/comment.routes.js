const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');

// Fetch Comments
// GET /api/reports/:id/comments
router.get('/reports/:id/comments', commentController.getComments);

// Post a Comment / Reply
// POST /api/reports/:id/comments
router.post('/reports/:id/comments', commentController.createComment);

// Like a Comment
// POST /api/comments/:id/like
router.post('/comments/:id/like', commentController.likeComment);

// Edit a comment (requires fingerprint or admin auth)
router.patch('/comments/:comment_id', commentController.editComment);

// Delete a comment (requires fingerprint or admin auth)
router.delete('/comments/:comment_id', commentController.deleteComment);

module.exports = router;
