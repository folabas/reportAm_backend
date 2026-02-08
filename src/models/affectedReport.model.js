const mongoose = require('mongoose');

const affectedReportSchema = new mongoose.Schema({
    report_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: true
    },
    ip_address: {
        type: String,
        required: true
    },
    fingerprint: {
        type: String, // Optional additional fingerprinting info
        default: ''
    }
}, { timestamps: true });

// Prevent duplicate "affected" markers from same IP on same report
affectedReportSchema.index({ report_id: 1, ip_address: 1 }, { unique: true });

module.exports = mongoose.model('AffectedReport', affectedReportSchema);
