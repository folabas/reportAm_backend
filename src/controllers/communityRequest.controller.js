const CommunityRequest = require('../models/communityRequest.model');
const Community = require('../models/community.model');

// @desc    Submit a new community request
// @route   POST /api/community-requests
// @access  Public
const createCommunityRequest = async (req, res) => {
    try {
        const {
            community_name,
            street_name,
            state_id,
            city_id,
            lga_id,
            address_description,
            image
        } = req.body;

        const request = await CommunityRequest.create({
            community_name,
            street_name,
            state_id,
            city_id,
            lga_id,
            address_description,
            image
        });

        res.status(201).json(request);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get all community requests
// @route   GET /api/admin/community-requests
// @access  Private/Admin
const getCommunityRequests = async (req, res) => {
    try {
        const requests = await CommunityRequest.find({})
            .populate('state_id', 'name')
            .populate('city_id', 'name')
            .populate('lga_id', 'name')
            .sort('-createdAt');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve a community request
// @route   POST /api/admin/community-requests/:id/approve
// @access  Private/Admin
const approveCommunityRequest = async (req, res) => {
    try {
        const request = await CommunityRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: `Request is already ${request.status}` });
        }

        // Create the community
        const community = await Community.create({
            name: request.community_name,
            street_name: request.street_name,
            state_id: request.state_id,
            city_id: request.city_id,
            lga_id: request.lga_id,
            address_description: request.address_description,
            image: request.image,
            is_approved: true
        });

        // Update request status
        request.status = 'approved';
        await request.save();

        res.json({ message: 'Community approved and created', community });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Reject a community request
// @route   POST /api/admin/community-requests/:id/reject
// @access  Private/Admin
const rejectCommunityRequest = async (req, res) => {
    try {
        const request = await CommunityRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ message: `Request is already ${request.status}` });
        }

        request.status = 'rejected';
        await request.save();

        res.json({ message: 'Community request rejected' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createCommunityRequest,
    getCommunityRequests,
    approveCommunityRequest,
    rejectCommunityRequest
};
