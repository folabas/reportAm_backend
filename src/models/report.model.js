const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['community', 'general'],
        required: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    state_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State',
        required: true
    },
    city_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',
        required: true
    },
    lga_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LGA',
        required: true
    },
    community_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        default: null,
        required: function () {
            return this.type === 'community';
        }
    },
    address_text: {
        type: String,
        required: true,
        trim: true
    },
    lat: {
        type: Number,
        default: null
    },
    lng: {
        type: Number,
        default: null
    },
    is_emergency: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'resolved'],
        default: 'pending'
    }
}, { timestamps: true });

// Validation for general report (community_id must be null)
reportSchema.pre('validate', function (next) {
    if (this.type === 'general' && this.community_id !== null) {
        this.community_id = null;
    }
    next();
});

module.exports = mongoose.model('Report', reportSchema);
