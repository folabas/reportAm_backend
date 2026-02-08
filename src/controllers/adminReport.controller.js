const Report = require('../models/report.model');
const AffectedReport = require('../models/affectedReport.model');

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
            .populate('city_id', 'name')
            .populate('lga_id', 'name')
            .sort('-createdAt');

        // Enhance with affected count
        const results = await Promise.all(reports.map(async (report) => {
            const count = await AffectedReport.countDocuments({ report_id: report._id });
            const reportObj = report.toObject();
            reportObj.affected_count = count;
            return reportObj;
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
        const { status } = req.body;

        if (!['pending', 'resolved'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status. Must be pending or resolved' });
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

        res.json({ message: 'Report and associated data deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getAllReportsAdmin,
    updateReportStatus,
    deleteReport
};
