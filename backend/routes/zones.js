const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zoneController');
const { authenticateToken } = require('../middleware/auth');

// Public route - get all zones
router.get('/', zoneController.getZones);

// Admin routes (protected)
router.get('/:id', authenticateToken, zoneController.getZoneById);
router.post('/', authenticateToken, zoneController.createZone);
router.put('/:id', authenticateToken, zoneController.updateZone);
router.delete('/:id', authenticateToken, zoneController.deleteZone);

module.exports = router;

