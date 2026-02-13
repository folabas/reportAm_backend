const express = require('express');
const router = express.Router();
const adminCommentController = require('../controllers/adminComment.controller');

// Get all comments
router.get('/', adminCommentController.getAllComments);

// Delete a comment
router.delete('/:id', adminCommentController.deleteComment);

module.exports = router;
