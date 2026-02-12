const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        trim: true,
        uppercase: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field: id as alias for _id
stateSchema.virtual('id').get(function () {
    return this._id.toString();
});

module.exports = mongoose.model('State', stateSchema);
