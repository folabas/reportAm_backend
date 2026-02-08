const State = require('../models/state.model');
const LGA = require('../models/lga.model');
const Community = require('../models/community.model');

// @desc    Get all states
// @route   GET /api/locations/states
// @access  Public
const getStates = async (req, res) => {
    try {
        const states = await State.find({}).sort('name');
        res.json(states);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getLGAs = async (req, res) => {
    try {
        const lgas = await LGA.find({ state_id: req.params.stateId }).sort('name');
        res.json(lgas);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get approved communities in an LGA
// @route   GET /api/locations/lgas/:lgaId/communities
// @access  Public
const getCommunities = async (req, res) => {
    try {
        const communities = await Community.find({
            lga_id: req.params.lgaId,
            is_approved: true
        }).sort('name');
        res.json(communities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all approved communities globally
// @route   GET /api/locations/communities
// @access  Public
const getGlobalCommunities = async (req, res) => {
    try {
        const communities = await Community.find({ is_approved: true })
            .populate('state_id', 'name')
            .populate('lga_id', 'name')
            .sort('name');
        res.json(communities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStates,
    getLGAs,
    getCommunities,
    getGlobalCommunities
};
