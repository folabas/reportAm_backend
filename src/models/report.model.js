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
    city: {
        type: String,
        trim: true
    },
    lga_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LGA',
        required: false  // Changed from required: true to optional
    },
    community_name: {
        type: String,
        default: null,
        trim: true,
        required: function () {
            return this.type === 'community';
        }
    },
    community_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        default: null
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
        enum: ['pending', 'in_progress', 'resolved'],  // Added 'in_progress'
        default: 'pending'
    },
    commentsCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field: city_id as alias for state_id (for API compatibility)
reportSchema.virtual('city_id').get(function () {
    return this.state_id;
});

// Indexes for performance
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ type: 1 });
reportSchema.index({ state_id: 1 });
reportSchema.index({ is_emergency: 1 });

// Validation for general report (community_name must be null)
reportSchema.pre('validate', function () {
    if (this.type === 'general' && this.community_name !== null) {
        this.community_name = null;
    }
});

module.exports = mongoose.model('Report', reportSchema);
