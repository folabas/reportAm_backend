const express = require('express');
const router = express.Router();
const adminCommentController = require('../controllers/adminComment.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

// Get all comments
router.get('/', adminCommentController.getAllComments);


// Delete a comment
router.delete('/:id', adminCommentController.deleteComment);

module.exports = router;
