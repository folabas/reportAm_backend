const Report = require('../models/report.model');
const AffectedReport = require('../models/affectedReport.model');

// Helper to format report object (same as in report.controller.js)
const formatReport = (report, affectedCount = 0) => {
    const reportObj = report.toObject ? report.toObject() : report;

    if (reportObj.state_id && typeof reportObj.state_id === 'object' && reportObj.state_id.name) {
        reportObj.state = reportObj.state_id.name;
    }

    if (reportObj.lga_id && typeof reportObj.lga_id === 'object' && reportObj.lga_id.name) {
        reportObj.lga = reportObj.lga_id.name;
    }

    if (reportObj.status === 'in_progress') {
        reportObj.status = 'in-progress';
    }

    reportObj.affected_count = affectedCount;
    return reportObj;
};

// @desc    Admin view all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
const getAllReportsAdmin = async (req, res) => {
    try {
        const { status, type } = req.query;
        let query = {};
        if (status) query.status = status;
        if (type) query.type = type;

        const reports = await Report.find(query)
            .populate('state_id', 'name')
            .populate('lga_id', 'name')
            .sort('-createdAt');

        // Enhance with affected count and flatten structure
        const results = await Promise.all(reports.map(async (report) => {
            const count = await AffectedReport.countDocuments({ report_id: report._id });
            return formatReport(report, count);
        }));

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update report status
// @route   PATCH /api/admin/reports/:id/status
// @access  Private/Admin
const updateReportStatus = async (req, res) => {
    try {
        let { status } = req.body;

        // Normalize status input
        if (status === 'in-progress') status = 'in_progress';

        if (!['pending', 'in_progress', 'resolved'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid status. Must be pending, in-progress, or resolved'
            });
        }

        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        report.status = status;
        await report.save();

        res.json({ message: `Report status updated to ${status}`, report });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete report
// @route   DELETE /api/admin/reports/:id
// @access  Private/Admin
const deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Delete associated affected records
        await AffectedReport.deleteMany({ report_id: report._id });

        // Delete the report
        await report.deleteOne();

        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get admin statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
    try {
        // Summary counts
        const totalReports = await Report.countDocuments();
        const pendingReports = await Report.countDocuments({ status: 'pending' });
        const resolvedReports = await Report.countDocuments({ status: 'resolved' });
        const inProgressReports = await Report.countDocuments({ status: 'in_progress' });
        const emergencyReports = await Report.countDocuments({ is_emergency: true });

        // Monthly breakdown (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyStats = await Report.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // LGA Stats (Top 5 LGAs with most reports)
        const lgaStats = await Report.aggregate([
            {
                $group: {
                    _id: "$lga_id",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "lgas",
                    localField: "_id",
                    foreignField: "_id",
                    as: "lga_info"
                }
            },
            {
                $project: {
                    lga: { $arrayElemAt: ["$lga_info.name", 0] },
                    count: 1
                }
            }
        ]);

        res.json({
            summary: {
                total: totalReports,
                pending: pendingReports,
                resolved: resolvedReports,
                in_progress: inProgressReports,
                emergency: emergencyReports
            },
            timeline: monthlyStats,
            top_lgas: lgaStats
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllReportsAdmin,
    updateReportStatus,
    deleteReport,
    getAdminStats
};
