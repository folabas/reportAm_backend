const State = require('../models/state.model');
const City = require('../models/city.model');
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

// @desc    Get cities in a state
// @route   GET /api/locations/states/:stateId/cities
// @access  Public
const getCities = async (req, res) => {
    try {
        const cities = await City.find({ state_id: req.params.stateId }).sort('name');
        res.json(cities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get LGAs in a city
// @route   GET /api/locations/cities/:cityId/lgas
// @access  Public
const getLGAs = async (req, res) => {
    try {
        const lgas = await LGA.find({ city_id: req.params.cityId }).sort('name');
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

module.exports = {
    getStates,
    getCities,
    getLGAs,
    getCommunities
};
