const mongoose = require('mongoose');

const communityRequestSchema = new mongoose.Schema({
    community_name: {
        type: String,
        required: true,
        trim: true
    },
    street_name: {
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
        required: true
    },
    address_description: {
        type: String,
        trim: true
    },
    image: {
        type: String, // URL to image
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('CommunityRequest', communityRequestSchema);
