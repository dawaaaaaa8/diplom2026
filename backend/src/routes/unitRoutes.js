const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// ==================== PUBLIC ROUTES ====================
router.get('/resort/:resortId', unitController.getUnitsByResort);
router.get('/check-availability', unitController.checkAvailability);
router.get('/:id', unitController.getUnitById);

// ==================== PROTECTED ROUTES ====================
router.post('/', authMiddleware, roleCheck('resort_owner'), unitController.createUnit);
router.put('/:id', authMiddleware, roleCheck('resort_owner'), unitController.updateUnit);
router.delete('/:id', authMiddleware, roleCheck('resort_owner'), unitController.deleteUnit);

// ❌ Зургийн routes-ыг хассан (unit_images таблиц байхгүй учраас)
// router.post('/:id/images', authMiddleware, roleCheck('resort_owner'), unitController.addUnitImage);
// router.delete('/:id/images/:imageId', authMiddleware, roleCheck('resort_owner'), unitController.deleteUnitImage);

module.exports = router;