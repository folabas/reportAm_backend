const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    report_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: true
    },
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    author_name: {
        type: String,
        trim: true,
        default: 'Anonymous'
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    fingerprint: {
        type: String,
        default: ''
    },
    ip_address: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Index for faster lookups
commentSchema.index({ report_id: 1, createdAt: -1 });
commentSchema.index({ parent_id: 1 });

module.exports = mongoose.model('Comment', commentSchema);
