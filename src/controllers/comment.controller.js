const Comment = require('../models/comment.model');
const Report = require('../models/report.model');

/**
 * Add a comment to a report or a reply to another comment
 */
exports.addComment = async (req, res) => {
    try {
        const { report_id } = req.params;
        const { content, author_name, parent_id, fingerprint } = req.body;
        const ip_address = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Verify report exists
        const report = await Report.findById(report_id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // If it's a reply, verify parent comment exists and ensure it's a top-level comment
        if (parent_id) {
            const parentComment = await Comment.findById(parent_id);
            if (!parentComment) {
                return res.status(404).json({ message: 'Parent comment not found' });
            }
            // Ensure the parent comment belongs to the same report
            if (parentComment.report_id.toString() !== report_id) {
                return res.status(400).json({ message: 'Parent comment does not belong to this report' });
            }
            // Limit nesting: Only allow replies to top-level comments (parent_id must be null)
            if (parentComment.parent_id !== null) {
                return res.status(400).json({ message: 'Only two levels of comments are allowed' });
            }
        }

        const comment = new Comment({
            report_id,
            parent_id: parent_id || null,
            content,
            author_name: author_name || 'Anonymous',
            fingerprint: fingerprint || '',
            ip_address
        });

        await comment.save();

        res.status(201).json({
            message: 'Comment added successfully',
            comment
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
};

/**
 * Get all comments for a specific report
 */
exports.getCommentsForReport = async (req, res) => {
    try {
        const { report_id } = req.params;

        // Get all comments for the report
        const allComments = await Comment.find({ report_id })
            .sort({ createdAt: 1 })
            .lean();

        // Organize into tree structure (top-level comments with their replies)
        const commentMap = {};
        const rootComments = [];

        allComments.forEach(comment => {
            comment.replies = [];
            commentMap[comment._id] = comment;
        });

        allComments.forEach(comment => {
            if (comment.parent_id) {
                const parent = commentMap[comment.parent_id];
                if (parent) {
                    parent.replies.push(comment);
                } else {
                    // Fallback if parent not found for some reason
                    rootComments.push(comment);
                }
            } else {
                rootComments.push(comment);
            }
        });

        res.status(200).json(rootComments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
};

/**
 * Edit a comment (Only by author via fingerprint or Admin)
 */
exports.editComment = async (req, res) => {
    try {
        const { comment_id } = req.params;
        const { content, fingerprint } = req.body;

        const comment = await Comment.findById(comment_id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if author (via fingerprint) or Admin
        const isAdmin = req.headers.authorization && req.headers.authorization.startsWith('Bearer');
        if (!isAdmin && comment.fingerprint !== fingerprint) {
            return res.status(403).json({ message: 'You are not authorized to edit this comment' });
        }

        comment.content = content;
        await comment.save();

        res.status(200).json({
            message: 'Comment updated successfully',
            comment
        });
    } catch (error) {
        console.error('Error editing comment:', error);
        res.status(500).json({ message: 'Error editing comment', error: error.message });
    }
};

/**
 * Delete a comment (Only by author via fingerprint or Admin)
 */
exports.deleteComment = async (req, res) => {
    try {
        const { comment_id } = req.params;
        const { fingerprint } = req.body; // Fingerprint required unless Admin

        const comment = await Comment.findById(comment_id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if author (via fingerprint) or Admin
        const isAdmin = req.headers.authorization && req.headers.authorization.startsWith('Bearer');
        if (!isAdmin && comment.fingerprint !== fingerprint) {
            return res.status(403).json({ message: 'You are not authorized to delete this comment' });
        }

        // If it's a top-level comment, delete all its replies as well
        if (!comment.parent_id) {
            await Comment.deleteMany({ parent_id: comment._id });
        }

        await Comment.findByIdAndDelete(comment_id);

        res.status(200).json({
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Error deleting comment', error: error.message });
    }
};
