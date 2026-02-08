const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    state_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State',
        required: true
    }
}, { timestamps: true });

// Ensure unique city names within a state
citySchema.index({ name: 1, state_id: 1 }, { unique: true });

module.exports = mongoose.model('City', citySchema);
