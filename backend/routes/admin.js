const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimit');

// Login route
router.post('/login', loginRateLimiter, adminController.login);

// Analytics route (protected)
router.get('/analytics', authenticateToken, reportController.getAnalytics);

// Reports routes (protected)
router.get('/reports', authenticateToken, reportController.getReports);
router.get('/reports/:id', authenticateToken, reportController.getReportById);
router.put('/reports/:id', authenticateToken, reportController.updateReportStatus);
router.delete('/reports/:id', authenticateToken, reportController.deleteReport);

module.exports = router;

