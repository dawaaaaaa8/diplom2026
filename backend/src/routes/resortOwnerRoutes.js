const express = require('express');
const router = express.Router();
const resortOwnerController = require('../controllers/resortOwnerController');
const { authenticate, authorize } = require('../middleware/auth');

// ==================== PUBLIC ROUTES ====================
router.post('/auth/register', resortOwnerController.registerResortOwner);
router.post('/auth/login', resortOwnerController.loginResortOwner);

// ==================== PROTECTED ROUTES ====================
router.use(authenticate);
router.use(authorize('resort_owner'));

// Dashboard
router.get('/dashboard/stats', resortOwnerController.getDashboardStats);

// Profile
router.get('/profile', resortOwnerController.getProfile);
router.put('/profile', resortOwnerController.updateProfile);

// Resort Management
router.get('/resorts', resortOwnerController.getMyResorts);
router.post('/resorts', resortOwnerController.createResort);
router.put('/resorts/:id', resortOwnerController.updateResort);

// Unit Management
router.get('/resorts/:resortId/units', resortOwnerController.getResortUnits);
router.post('/resorts/:resortId/units', resortOwnerController.createUnit);
router.put('/units/:unitId', resortOwnerController.updateUnit);

// Booking Management
router.get('/bookings', resortOwnerController.getBookings);
router.put('/bookings/:id/status', resortOwnerController.updateBookingStatus);

// Revenue Reports
router.get('/revenue', resortOwnerController.getRevenueReport);

module.exports = router;