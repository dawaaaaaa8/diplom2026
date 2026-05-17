const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/', locationController.getAllLocations);
router.get('/provinces', locationController.getProvinces);
router.get('/provinces/:province/cities', locationController.getCitiesByProvince);

module.exports = router;