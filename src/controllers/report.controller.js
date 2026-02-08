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
            image,
            description,
            state_id,
            city_id,
            lga_id,
            community_id,
            address_text,
            lat,
            lng,
            is_emergency
        } = req.body;

        const report = await Report.create({
            type,
            category,
            image,
            description,
            state_id,
            city_id,
            lga_id,
            community_id,
            address_text,
            lat,
            lng,
            is_emergency: is_emergency || false,
            status: 'pending'
        });

        res.status(201).json(report);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get public report feed
// @route   GET /api/reports
// @access  Public
const getReports = async (req, res) => {
    try {
        const { state, city, lga, community, category, type } = req.query;
        let query = {};

        if (state) query.state_id = state;
        if (city) query.city_id = city;
        if (lga) query.lga_id = lga;
        if (community) query.community_id = community;
        if (category) query.category = category;
        if (type) query.type = type;

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const reports = await Report.find(query)
            .populate('state_id', 'name')
            .populate('city_id', 'name')
            .populate('lga_id', 'name')
            .populate('community_id', 'name')
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
            .populate('city_id', 'name')
            .populate('lga_id', 'name')
            .populate('community_id', 'name');

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
        const ip_address = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const { fingerprint } = req.body;

        const alreadyAffected = await AffectedReport.findOne({ report_id, ip_address });
        if (alreadyAffected) {
            return res.status(400).json({ message: 'You have already marked this report as affected' });
        }

        await AffectedReport.create({
            report_id,
            ip_address,
            fingerprint: fingerprint || ''
        });

        res.status(201).json({ message: 'Marked as affected' });
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

        res.json({ message: 'Removed affected status' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createReport,
    getReports,
    getReportById,
    markAffected,
    removeAffected
};
