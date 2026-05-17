const express = require('express');
const router = express.Router();
const resortTypeController = require('../controllers/resortTypeController');

router.get('/', resortTypeController.getAllResortTypes);
router.get('/:id', resortTypeController.getResortTypeById);

module.exports = router;