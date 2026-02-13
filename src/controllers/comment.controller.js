const Comment = require('../models/comment.model');
const Report = require('../models/report.model');

/**
 * Get comments for a report
 * GET /api/reports/:id/comments
 */
exports.getComments = async (req, res) => {
    try {
        const { id } = req.params; // reportId
        const { page = 1, limit = 20 } = req.query;

        const comments = await Comment.find({ reportId: id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // Organize into threads (optional but nice to have)
        // Since we are paginating, full threading might be tricky if parents are on other pages.
        // For now, let's just return the flat list sorted by date as requested,
        // but maybe the frontend handles threading?
        // User asked: "sorted by createdAt (descending) or grouped by thread if possible"
        // If we paginate, flat list is safer. But let's try to group if they are on the same page.
        // Actually, for simplicity and ensuring pagination works, let's return flat list.
        // If we want threading, we usually fetch top-level comments and then populate replies, or fetch all.

        // Let's return flat list for now, as it's easier to paginate.

        res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
};

/**
<<<<<<< HEAD
 * Post a comment
 * POST /api/reports/:id/comments
 */
exports.createComment = async (req, res) => {
    try {
        const { id } = req.params; // reportId
        const { text, parentId, username, userId } = req.body;
        // userId might come from auth middleware if added, but spec says "userId (Optional): Reference to User if logged in"
        // We generally expect req.user from auth middleware, but let's assume body for now if not authenticated.

        // Validate text length
        if (!text || text.length > 50) {
            return res.status(400).json({ message: 'Text is required and must be max 50 characters' });
        }

        // Verify report exists
        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Verify parent comment if provided
        if (parentId) {
            const parent = await Comment.findById(parentId);
            if (!parent) {
                return res.status(404).json({ message: 'Parent comment not found' });
            }
        }

        const newComment = new Comment({
            reportId: id,
            userId: userId || null, // Or req.user? keeping flexible as per spec
            username: username || 'Anonymous User',
            text,
            parentId: parentId || null,
            likes: []
        });

        await newComment.save();

        // Increment commentsCount in Report
        await Report.findByIdAndUpdate(id, { $inc: { commentsCount: 1 } });

        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ message: 'Error creating comment', error: error.message });
    }
};

/**
 * Like a comment
 * POST /api/comments/:id/like
 */
exports.likeComment = async (req, res) => {
    try {
        const { id } = req.params; // commentId
        // Identifier for like: User ID or IP
        const userIdOrIp = req.body.userId || req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        const comment = await Comment.findById(id);
=======
 * Edit a comment (Only by author via fingerprint or Admin)
 */
exports.editComment = async (req, res) => {
    try {
        const { comment_id } = req.params;
        const { content, fingerprint } = req.body;

        const comment = await Comment.findById(comment_id);
>>>>>>> c5ae2f78f68a28203fdce858a396490de5c2e1d7
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

<<<<<<< HEAD
        const index = comment.likes.indexOf(userIdOrIp);
        if (index === -1) {
            // Like
            comment.likes.push(userIdOrIp);
        } else {
            // Unlike
            comment.likes.splice(index, 1);
        }

        await comment.save();

        res.status(200).json({ likesCount: comment.likes.length, likes: comment.likes });
    } catch (error) {
        console.error('Error liking comment:', error);
        res.status(500).json({ message: 'Error liking comment', error: error.message });
=======
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
>>>>>>> c5ae2f78f68a28203fdce858a396490de5c2e1d7
    }
};
