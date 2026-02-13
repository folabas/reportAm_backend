const Comment = require('../models/comment.model');
const Report = require('../models/report.model');

/**
 * Get all comments (for admin)
 * GET /api/admin/comments
 */
exports.getAllComments = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const comments = await Comment.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('reportId', 'description type status') // useful info for admin
            .lean();

        const total = await Comment.countDocuments();

        res.status(200).json({
            comments,
            totalPages: Math.ceil(total / limit),
            currentPage: Number(page),
            total
        });
    } catch (error) {
        console.error('Error fetching admin comments:', error);
        res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
};

/**
 * Delete a comment
 * DELETE /api/admin/comments/:id
 */
exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Remove comment
        await Comment.findByIdAndDelete(id);

        // Also delete all replies to this comment
        // This is important to allow deleting a thread, or we could leave them orphaned or set parentId null.
        // Deleting replies is cleaner.
        await Comment.deleteMany({ parentId: id });

        // Decrement commentsCount in Report
        // Note: we should strictly decrement by 1 + number of replies deleted.
        // But for simplicity/performance in this quick impl, we can just decrement 1 or recount.
        // Let's just decrement 1 for the main comment.
        // OR better: recount all comments for the report to be accurate.
        const count = await Comment.countDocuments({ reportId: comment.reportId });
        await Report.findByIdAndUpdate(comment.reportId, { commentsCount: count });

        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Error deleting comment', error: error.message });
    }
};
