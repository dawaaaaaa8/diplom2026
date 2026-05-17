const { query } = require('../config/database');

class BookingController {
  // ==================== CREATE BOOKING ====================
  async createBooking(req, res) {
    try {
      const { unit_id, start_date, end_date, guests, special_requests } = req.body;
      const user_id = req.userId;
      
      // Check unit availability
      const unitCheck = await query(
        `SELECT u.*, r.name as resort_name 
         FROM units u
         JOIN resorts r ON u.resort_id = r.id
         WHERE u.id = $1 AND u.is_available = true`,
        [unit_id]
      );
      
      if (unitCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Өрөө олдсонгүй эсвэл захиалга боломжгүй' });
      }
      
      const unit = unitCheck.rows[0];
      const start = new Date(start_date);
      const end = new Date(end_date);
      const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const total_price = unit.price_per_night * nights;
      
      // Check for overlapping bookings
      const conflictCheck = await query(
        `SELECT id FROM bookings 
         WHERE unit_id = $1 
         AND status NOT IN ('cancelled', 'rejected')
         AND (
           (start_date <= $2 AND end_date >= $2) OR
           (start_date <= $3 AND end_date >= $3) OR
           (start_date >= $2 AND end_date <= $3)
         )`,
        [unit_id, start_date, end_date]
      );
      
      if (conflictCheck.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'Энэ хугацаанд өрөө захиалгатай байна' });
      }
      
      const result = await query(
        `INSERT INTO bookings (user_id, unit_id, start_date, end_date, guests, total_price, special_requests, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [user_id, unit_id, start_date, end_date, guests, total_price, special_requests]
      );
      
      res.status(201).json({
        success: true,
        message: 'Захиалга амжилттай үүсгэгдлээ',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== GET USER BOOKINGS ====================
  async getUserBookings(req, res) {
    try {
      const result = await query(
        `SELECT b.*, 
                u.name as unit_name, u.type as unit_type, u.price_per_night,
                r.name as resort_name, r.id as resort_id, r.cover_image as resort_image
         FROM bookings b
         JOIN units u ON b.unit_id = u.id
         JOIN resorts r ON u.resort_id = r.id
         WHERE b.user_id = $1
         ORDER BY b.created_at DESC`,
        [req.userId]
      );
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get user bookings error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== GET OWNER BOOKINGS ====================
  async getOwnerBookings(req, res) {
    try {
      const ownerId = req.userId;
      
      const result = await query(
        `SELECT 
          b.id,
          b.start_date,
          b.end_date,
          b.guests,
          b.total_price,
          b.status,
          b.special_requests,
          b.created_at,
          u.name as user_name,
          u.email as user_email,
          u.phone as user_phone,
          r.id as resort_id,
          r.name as resort_name,
          ut.name as unit_name,
          ut.price_per_night
         FROM bookings b
         JOIN units ut ON b.unit_id = ut.id
         JOIN resorts r ON ut.resort_id = r.id
         JOIN users u ON b.user_id = u.id
         WHERE r.owner_id = $1
         ORDER BY b.created_at DESC`,
        [ownerId]
      );
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get owner bookings error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== CANCEL BOOKING ====================
  async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      
      const result = await query(
        `UPDATE bookings 
         SET status = 'cancelled', updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, req.userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Захиалга олдсонгүй' });
      }
      
      res.json({
        success: true,
        message: 'Захиалга цуцлагдлаа',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== UPDATE BOOKING STATUS (OWNER) ====================
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const ownerId = req.userId;
      
      // Check if booking belongs to owner's resort
      const check = await query(
        `SELECT b.id 
         FROM bookings b
         JOIN units ut ON b.unit_id = ut.id
         JOIN resorts r ON ut.resort_id = r.id
         WHERE b.id = $1 AND r.owner_id = $2`,
        [id, ownerId]
      );
      
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Захиалга олдсонгүй' });
      }
      
      const result = await query(
        `UPDATE bookings 
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );
      
      res.json({
        success: true,
        message: 'Захиалгын төлөв амжилттай шинэчлэгдлээ',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }
}

module.exports = new BookingController();