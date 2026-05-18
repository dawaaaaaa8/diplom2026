const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(authMiddleware);
router.use(roleCheck('admin'));

// Dashboard
router.get('/stats', adminController.getDashboardStats);

// Resort owner management
router.get('/pending-owners', adminController.getPendingOwners);
router.put('/approve-owner/:id', adminController.approveResortOwner);
router.put('/reject-owner/:id', adminController.rejectResortOwner);

// Resort management
router.get('/resorts', adminController.getAllResortsAdmin);
router.get('/pending-resorts', adminController.getPendingResorts);
router.get('/resorts/:id', adminController.getResortDetails);
router.put('/approve-resort/:id', adminController.approveResort);
router.delete('/reject-resort/:id', adminController.rejectResort);

// Users and Bookings
router.get('/users', adminController.getAllUsers);
router.get('/bookings', adminController.getAllBookings);

module.exports = router;