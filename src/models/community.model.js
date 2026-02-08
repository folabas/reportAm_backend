const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
    name: {
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
    is_approved: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// A community is unique by its name and LGA
communitySchema.index({ name: 1, lga_id: 1 }, { unique: true });

module.exports = mongoose.model('Community', communitySchema);
