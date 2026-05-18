const { query } = require('../config/database');

class ResortTypeController {
  // Get all resort types
  async getAllResortTypes(req, res) {
    try {
      const result = await query(
        `SELECT * FROM resort_types WHERE is_active = true ORDER BY sort_order, name_mn`
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get resort types error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // Get resort type by id
  async getResortTypeById(req, res) {
    try {
      const { id } = req.params;
      const result = await query(
        `SELECT * FROM resort_types WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Төрөл олдсонгүй' });
      }
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Get resort type error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }
}

module.exports = new ResortTypeController();