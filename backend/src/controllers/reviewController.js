const { query } = require('../config/database');

class ReviewController {
  // Get reviews by resort
  async getByResort(req, res) {
    try {
      const { resortId } = req.params;
      
      const result = await query(
        `SELECT r.*, 
                u.name as user_name
         FROM bookings_reviews r
         JOIN bookings b ON r.booking_id = b.id
         JOIN units un ON b.unit_id = un.id
         JOIN resorts rs ON un.resort_id = rs.id
         JOIN users u ON b.user_id = u.id
         WHERE rs.id = $1
         ORDER BY r.created_at DESC`,
        [resortId]
      );
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get reviews error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // Get user's review for a resort
  async getUserReview(req, res) {
    try {
      const { resortId } = req.params;
      const userId = req.userId;
      
      const result = await query(
        `SELECT r.* 
         FROM bookings_reviews r
         JOIN bookings b ON r.booking_id = b.id
         JOIN units un ON b.unit_id = un.id
         WHERE un.resort_id = $1 AND b.user_id = $2
         LIMIT 1`,
        [resortId, userId]
      );
      
      res.json({ success: true, data: result.rows[0] || null });
    } catch (error) {
      console.error('Get user review error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // Create review
  async create(req, res) {
    try {
      const { resort_id, rating, comment } = req.body;
      const userId = req.userId;
      
      // Check if user has booked this resort (through units)
      const bookingCheck = await query(
        `SELECT b.id 
         FROM bookings b
         JOIN units un ON b.unit_id = un.id
         WHERE b.user_id = $1 AND un.resort_id = $2 AND b.status = 'confirmed'
         LIMIT 1`,
        [userId, resort_id]
      );
      
      if (bookingCheck.rows.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'Та энэ амралтын газрыг захиалаагүй байна' 
        });
      }
      
      // Check if user already reviewed this resort
      const existingReview = await query(
        `SELECT r.id 
         FROM bookings_reviews r
         JOIN bookings b ON r.booking_id = b.id
         JOIN units un ON b.unit_id = un.id
         WHERE b.user_id = $1 AND un.resort_id = $2`,
        [userId, resort_id]
      );
      
      if (existingReview.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Та аль хэдийн үнэлгээ үлдээсэн байна' 
        });
      }
      
      // Insert review
      const result = await query(
        `INSERT INTO bookings_reviews (booking_id, rating, comment, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [bookingCheck.rows[0].id, rating, comment]
      );
      
      // Update resort total rating and review count
      await query(
        `UPDATE resorts 
         SET total_rating = (
           SELECT COALESCE(AVG(r.rating), 0) 
           FROM bookings_reviews r
           JOIN bookings b ON r.booking_id = b.id
           JOIN units un ON b.unit_id = un.id
           WHERE un.resort_id = $1
         ),
         review_count = (
           SELECT COUNT(*) 
           FROM bookings_reviews r
           JOIN bookings b ON r.booking_id = b.id
           JOIN units un ON b.unit_id = un.id
           WHERE un.resort_id = $1
         )
         WHERE id = $1`,
        [resort_id]
      );
      
      res.status(201).json({ 
        success: true, 
        message: 'Үнэлгээ амжилттай үлдээлээ',
        data: result.rows[0] 
      });
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // Update review
  async update(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = req.userId;
      
      // Check ownership and get resort_id
      const check = await query(
        `SELECT r.*, b.user_id, un.resort_id
         FROM bookings_reviews r
         JOIN bookings b ON r.booking_id = b.id
         JOIN units un ON b.unit_id = un.id
         WHERE r.id = $1`,
        [id]
      );
      
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Үнэлгээ олдсонгүй' });
      }
      
      if (check.rows[0].user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Энэ үйлдлийг хийх эрхгүй' });
      }
      
      const resortId = check.rows[0].resort_id;
      
      const result = await query(
        `UPDATE bookings_reviews 
         SET rating = $1, comment = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [rating, comment, id]
      );
      
      // Update resort rating
      await query(
        `UPDATE resorts 
         SET total_rating = (
           SELECT COALESCE(AVG(r.rating), 0) 
           FROM bookings_reviews r
           JOIN bookings b ON r.booking_id = b.id
           JOIN units un ON b.unit_id = un.id
           WHERE un.resort_id = $1
         )
         WHERE id = $1`,
        [resortId]
      );
      
      res.json({ 
        success: true, 
        message: 'Үнэлгээ амжилттай шинэчлэгдлээ',
        data: result.rows[0] 
      });
    } catch (error) {
      console.error('Update review error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // Delete review
  async delete(req, res) {
    try {
      const { id } = req.params;
      const userId = req.userId;
      
      // Check ownership and get resort_id
      const check = await query(
        `SELECT r.*, b.user_id, un.resort_id
         FROM bookings_reviews r
         JOIN bookings b ON r.booking_id = b.id
         JOIN units un ON b.unit_id = un.id
         WHERE r.id = $1`,
        [id]
      );
      
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Үнэлгээ олдсонгүй' });
      }
      
      if (check.rows[0].user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Энэ үйлдлийг хийх эрхгүй' });
      }
      
      const resortId = check.rows[0].resort_id;
      
      await query(`DELETE FROM bookings_reviews WHERE id = $1`, [id]);
      
      // Update resort rating
      await query(
        `UPDATE resorts 
         SET total_rating = (
           SELECT COALESCE(AVG(r.rating), 0) 
           FROM bookings_reviews r
           JOIN bookings b ON r.booking_id = b.id
           JOIN units un ON b.unit_id = un.id
           WHERE un.resort_id = $1
         ),
         review_count = (
           SELECT COUNT(*) 
           FROM bookings_reviews r
           JOIN bookings b ON r.booking_id = b.id
           JOIN units un ON b.unit_id = un.id
           WHERE un.resort_id = $1
         )
         WHERE id = $1`,
        [resortId]
      );
      
      res.json({ 
        success: true, 
        message: 'Үнэлгээ амжилттай устгагдлаа' 
      });
    } catch (error) {
      console.error('Delete review error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }
}

module.exports = new ReviewController();