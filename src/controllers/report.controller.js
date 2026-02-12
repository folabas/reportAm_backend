const Report = require('../models/report.model');
const AffectedReport = require('../models/affectedReport.model');

// @desc    Create a new report
// @route   POST /api/reports
// @access  Public
const createReport = async (req, res) => {
    try {
        const {
            type,
            category,
            description,
            state_id,
            city_id,  // Accept city_id as alias for state_id
            city,
            lga_id,
            community_name,
            community_id,
            address_text,
            lat,
            lng,
            is_emergency
        } = req.body;

        // Validate required fields
        const requiredFields = ['type', 'category', 'description', 'address_text', 'community_name'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['type', 'category', 'description', 'image', 'city_id', 'address_text', 'community_name'],
                missing: missingFields
            });
        }

        // Check if image was uploaded
        if (!req.file) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['type', 'category', 'description', 'image', 'city_id', 'address_text', 'community_name'],
                missing: ['image']
            });
        }

        // Use city_id if provided, otherwise use state_id
        const stateId = city_id || state_id;
        if (!stateId) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['type', 'category', 'description', 'image', 'city_id', 'address_text', 'community_name'],
                missing: ['city_id']
            });
        }

        // Generate image URL from uploaded file
        const imageUrl = `/uploads/${req.file.filename}`;

        // Create report in database
        const report = await Report.create({
            type,
            category,
            image: imageUrl,
            description,
            state_id: stateId,
            city,
            lga_id: lga_id || null,
            community_name,
            community_id: community_id || null,
            address_text,
            lat: lat ? parseFloat(lat) : null,
            lng: lng ? parseFloat(lng) : null,
            is_emergency: is_emergency === 'true' || is_emergency === true,
            status: 'pending'
        });

        // Return response with affected_count
        const reportObj = report.toObject();
        reportObj.affected_count = 0;

        res.status(201).json({
            message: 'Report created successfully',
            report: reportObj
        });
    } catch (error) {
        console.error('Report creation error:', error);
        res.status(400).json({
            message: 'Failed to create report',
            error: error.message
        });
    }
};

// @desc    Get public report feed
// @route   GET /api/reports
// @access  Public
const getReports = async (req, res) => {
    try {
        const { state, city, lga, community, community_id, category, type, status, is_emergency } = req.query;
        let query = {};

        if (state) query.state_id = state;
        if (city) query.city = { $regex: city, $options: 'i' };
        if (lga) query.lga_id = lga;
        if (community) query.community_name = { $regex: community, $options: 'i' };
        if (community_id) query.community_id = community_id;
        if (category) query.category = category;
        if (type) query.type = type;
        if (status) query.status = status;
        if (is_emergency !== undefined) query.is_emergency = is_emergency === 'true' || is_emergency === true;

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const reports = await Report.find(query)
            .populate('state_id', 'name')
            .populate('lga_id', 'name')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        const total = await Report.countDocuments(query);

        // Get affected counts for these reports
        const reportIds = reports.map(r => r._id);
        const affectedCounts = await AffectedReport.aggregate([
            { $match: { report_id: { $in: reportIds } } },
            { $group: { _id: '$report_id', count: { $sum: 1 } } }
        ]);

        const countMap = {};
        affectedCounts.forEach(item => {
            countMap[item._id.toString()] = item.count;
        });

        const results = reports.map(report => {
            const reportObj = report.toObject();
            reportObj.affected_count = countMap[report._id.toString()] || 0;
            return reportObj;
        });

        res.json({
            reports: results,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Public
const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('state_id', 'name')
            .populate('lga_id', 'name');

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const affected_count = await AffectedReport.countDocuments({ report_id: report._id });

        const result = report.toObject();
        result.affected_count = affected_count;

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark report as affected
// @route   POST /api/reports/:id/affected
// @access  Public
const markAffected = async (req, res) => {
    try {
        const report_id = req.params.id;
        const ip_address = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
        const { fingerprint } = req.body || {};

        const alreadyAffected = await AffectedReport.findOne({ report_id, ip_address });
        if (alreadyAffected) {
            return res.status(400).json({ message: 'You have already marked this report as affected' });
        }

        await AffectedReport.create({
            report_id,
            ip_address,
            fingerprint: fingerprint || ''
        });

        // Get updated affected count
        const affected_count = await AffectedReport.countDocuments({ report_id });

        res.status(201).json({
            message: 'Marked as affected',
            affected_count
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Remove affected status
// @route   DELETE /api/reports/:id/affected
// @access  Public
const removeAffected = async (req, res) => {
    try {
        const report_id = req.params.id;
        const ip_address = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        await AffectedReport.deleteOne({ report_id, ip_address });

        // Get updated affected count
        const affected_count = await AffectedReport.countDocuments({ report_id });

        res.json({
            message: 'Unmarked as affected',
            affected_count
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get reports for a specific community
// @route   GET /api/reports/community/:communityId
// @access  Public
const getReportsByCommunity = async (req, res) => {
    try {
        const query = { community_id: req.params.communityId };

        const reports = await Report.find(query)
            .populate('state_id', 'name')
            .populate('lga_id', 'name')
            .sort('-createdAt');

        const reportIds = reports.map(r => r._id);
        const affectedCounts = await AffectedReport.aggregate([
            { $match: { report_id: { $in: reportIds } } },
            { $group: { _id: '$report_id', count: { $sum: 1 } } }
        ]);

        const countMap = {};
        affectedCounts.forEach(item => {
            countMap[item._id.toString()] = item.count;
        });

        const results = reports.map(report => {
            const reportObj = report.toObject();
            reportObj.affected_count = countMap[report._id.toString()] || 0;
            return reportObj;
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createReport,
    getReports,
    getReportsByCommunity,
    getReportById,
    markAffected,
    removeAffected
};
