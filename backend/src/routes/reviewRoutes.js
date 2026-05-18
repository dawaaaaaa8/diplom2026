const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

// ==================== PUBLIC ROUTES ====================
router.get('/resort/:resortId', reviewController.getByResort);

// ==================== PROTECTED ROUTES ====================
router.get('/user/:resortId', authMiddleware, reviewController.getUserReview);
router.post('/', authMiddleware, reviewController.create);
router.put('/:id', authMiddleware, reviewController.update);
router.delete('/:id', authMiddleware, reviewController.delete);

module.exports = router;