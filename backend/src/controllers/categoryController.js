const { query } = require('../config/database');

class CategoryController {
  // Get all categories
  async getAllCategories(req, res) {
    try {
      const result = await query(
        `SELECT * FROM categories ORDER BY name`
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // Get category by id
  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const result = await query(
        `SELECT * FROM categories WHERE id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Ангилал олдсонгүй' });
      }
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }
}

module.exports = new CategoryController();