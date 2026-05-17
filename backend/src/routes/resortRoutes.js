const express = require('express');
const router = express.Router();
const resortController = require('../controllers/resortController');
const authMiddleware = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// ==================== PUBLIC ROUTES ====================
router.get('/', resortController.getAllResorts);
router.get('/featured', resortController.getFeaturedResorts);
router.get('/search', resortController.searchResorts);
router.get('/location', resortController.getResortsByLocation);
router.get('/:id', resortController.getResortById);

// ==================== PROTECTED ROUTES (OWNER ONLY) ====================
router.post('/', 
  authMiddleware, 
  roleCheck('resort_owner'), 
  resortController.createResort
);

router.get('/owner/my-resorts', 
  authMiddleware, 
  roleCheck('resort_owner'), 
  resortController.getOwnerResorts
);

router.put('/:id', 
  authMiddleware, 
  resortController.updateResort
);

router.delete('/:id', 
  authMiddleware, 
  resortController.deleteResort
);

router.put('/:id/images', 
  authMiddleware, 
  resortController.updateResortImages
);

module.exports = router;