const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { reportRateLimiter } = require('../middleware/rateLimit');

// Public routes
router.get('/', reportController.getReports);
router.post('/', reportRateLimiter, upload.single('foto'), reportController.createReport);

// Admin routes (protected)
router.get('/:id', authenticateToken, reportController.getReportById);
router.put('/:id', authenticateToken, reportController.updateReportStatus);
router.delete('/:id', authenticateToken, reportController.deleteReport);

module.exports = router;

