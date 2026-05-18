const { query } = require('../config/database');

class LocationController {
  // Get all locations
  async getAllLocations(req, res) {
    try {
      const result = await query(
        `SELECT * FROM locations ORDER BY province, city`
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get locations error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // Get unique provinces
  async getProvinces(req, res) {
    try {
      const result = await query(
        `SELECT DISTINCT province FROM locations ORDER BY province`
      );
      res.json({ success: true, data: result.rows.map(r => r.province) });
    } catch (error) {
      console.error('Get provinces error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // Get cities by province
  async getCitiesByProvince(req, res) {
    try {
      const { province } = req.params;
      const result = await query(
        `SELECT city FROM locations WHERE province = $1 ORDER BY city`,
        [province]
      );
      res.json({ success: true, data: result.rows.map(r => r.city) });
    } catch (error) {
      console.error('Get cities error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }
}

module.exports = new LocationController();