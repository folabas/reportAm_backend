const mongoose = require('mongoose');

const lgaSchema = new mongoose.Schema({
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

// Ensure unique LGA names within a state
lgaSchema.index({ name: 1, state_id: 1 }, { unique: true });

module.exports = mongoose.model('LGA', lgaSchema);
