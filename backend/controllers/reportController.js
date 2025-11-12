const Report = require('../models/Report');
const Joi = require('joi');
const fs = require('fs');
const path = require('path');

// Validation schema for report submission
const reportSchema = Joi.object({
  lokasi: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }).required(),
  tanggal_kejadian: Joi.date().max('now').required(),
  jenis_kejahatan: Joi.string().valid('pencurian', 'perampokan', 'kekerasan', 'narkoba', 'lainnya').required(),
  deskripsi: Joi.string().max(1000).allow('').optional(),
});

// Get all reports (public - for map)
const getReports = async (req, res) => {
  try {
    const filters = {
      status: req.query.status || 'verified', // Only show verified reports on public map
      jenis_kejahatan: req.query.jenis_kejahatan,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      bounds: req.query.bounds ? JSON.parse(req.query.bounds) : null,
      limit: req.query.limit ? parseInt(req.query.limit) : null,
      offset: req.query.offset ? parseInt(req.query.offset) : null,
    };

    const reports = await Report.findAll(filters);
    res.json(reports);
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ error: 'Gagal mengambil data laporan' });
  }
};

// Submit new report
const createReport = async (req, res) => {
  try {
    // Parse JSON fields from form data
    let lokasi;
    try {
      lokasi = typeof req.body.lokasi === 'string' ? JSON.parse(req.body.lokasi) : req.body.lokasi;
    } catch (e) {
      return res.status(400).json({ error: 'Format lokasi tidak valid' });
    }

    const reportData = {
      lokasi: lokasi,
      tanggal_kejadian: req.body.tanggal_kejadian,
      jenis_kejahatan: req.body.jenis_kejahatan,
      deskripsi: req.body.deskripsi || '',
    };

    // Validate request body
    const { error, value } = reportSchema.validate(reportData);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Validate date (not more than 30 days ago)
    const tanggalKejadian = new Date(value.tanggal_kejadian);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (tanggalKejadian < thirtyDaysAgo) {
      return res.status(400).json({ error: 'Tanggal kejadian tidak boleh lebih dari 30 hari yang lalu' });
    }

    // Get IP address
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

    // Check rate limiting
    const recentReports = await Report.checkRecentReports(ipAddress, 1);
    if (recentReports >= 3) {
      return res.status(429).json({ error: 'Terlalu banyak laporan. Silakan coba lagi dalam 1 jam.' });
    }

    // Handle file upload
    let fotoPath = null;
    if (req.file) {
      fotoPath = req.file.path;
    }

    // Create report
    const finalReportData = {
      lokasi: value.lokasi,
      tanggal_kejadian: value.tanggal_kejadian,
      jenis_kejahatan: value.jenis_kejahatan,
      deskripsi: value.deskripsi || '',
      foto_path: fotoPath,
      ip_address: ipAddress,
    };

    const report = await Report.create(finalReportData);

    res.status(201).json({
      message: 'Laporan berhasil dikirim',
      report: report,
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Gagal mengirim laporan' });
  }
};

// Get report by ID (admin)
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error getting report:', error);
    res.status(500).json({ error: 'Gagal mengambil data laporan' });
  }
};

// Update report status (admin)
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    const report = await Report.updateStatus(id, status);

    if (!report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    }

    res.json({
      message: 'Status laporan berhasil diupdate',
      report: report,
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: 'Gagal mengupdate status laporan' });
  }
};

// Delete report (admin)
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.delete(id);

    if (!report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    }

    // Delete associated photo file
    if (report.foto_path) {
      const photoPath = path.join(__dirname, '..', report.foto_path);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    res.json({ message: 'Laporan berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Gagal menghapus laporan' });
  }
};

// Get analytics data (admin)
const getAnalytics = async (req, res) => {
  try {
    const totalReports = await Report.countTotal();
    const todayReports = await Report.countToday();
    const reportsByStatus = await Report.countByStatus();
    const reportsByJenis = await Report.countByJenis();

    // Get reports for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const reportsByDate = await Report.countByDateRange(sixMonthsAgo, new Date());

    res.json({
      totalReports,
      todayReports,
      reportsByStatus,
      reportsByJenis,
      reportsByDate,
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Gagal mengambil data analytics' });
  }
};

module.exports = {
  getReports,
  createReport,
  getReportById,
  updateReportStatus,
  deleteReport,
  getAnalytics,
};

