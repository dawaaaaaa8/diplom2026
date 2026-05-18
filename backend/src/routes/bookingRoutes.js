const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// ==================== USER ROUTES ====================
router.get('/my-bookings', authMiddleware, bookingController.getUserBookings);

// ==================== OWNER ROUTES ====================
router.get('/owner-bookings', authMiddleware, roleCheck('resort_owner'), bookingController.getOwnerBookings);

// ==================== OTHER ROUTES ====================
router.post('/', authMiddleware, bookingController.createBooking);
router.put('/:id/cancel', authMiddleware, bookingController.cancelBooking);
router.put('/:id/status', authMiddleware, roleCheck('resort_owner'), bookingController.updateStatus);

module.exports = router;