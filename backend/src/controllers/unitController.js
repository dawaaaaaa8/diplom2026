const { query } = require('../config/database');

class UnitController {
  // ==================== GET UNITS BY RESORT ====================
  async getUnitsByResort(req, res) {
    try {
      const { resortId } = req.params;
      
      const result = await query(
        `SELECT u.*, 
                COALESCE(u.image_url, '/uploads/default-unit.jpg') as display_image,
                COUNT(DISTINCT b.id) as booking_count
         FROM units u
         LEFT JOIN bookings b ON b.unit_id = u.id AND b.status IN ('confirmed', 'pending')
         WHERE u.resort_id = $1
         GROUP BY u.id
         ORDER BY u.price_per_night ASC`,
        [resortId]
      );
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get units error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== GET UNIT BY ID ====================
  async getUnitById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await query(
        `SELECT u.*, r.name as resort_name, r.owner_id, r.id as resort_id
         FROM units u
         JOIN resorts r ON u.resort_id = r.id
         WHERE u.id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Өрөө олдсонгүй' });
      }
      
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Get unit error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== CREATE UNIT ====================
  async createUnit(req, res) {
    try {
      const { 
        resort_id, name, type, capacity, beds, bedrooms, bathrooms,
        size_sqm, price_per_night, discount_price, description, 
        amenities, image_url, quantity, is_available
      } = req.body;
      
      const owner_id = req.userId;
      const userRole = req.user?.role_name;
      
      // Check if user owns the resort
      const resortCheck = await query(
        `SELECT owner_id FROM resorts WHERE id = $1`,
        [resort_id]
      );
      
      if (resortCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Амралтын газар олдсонгүй' });
      }
      
      if (resortCheck.rows[0].owner_id !== owner_id && userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Энэ үйлдлийг хийх эрхгүй' });
      }
      
      const result = await query(
        `INSERT INTO units (
          resort_id, name, type, capacity, beds, bedrooms, bathrooms,
          size_sqm, price_per_night, discount_price, description, 
          amenities, image_url, quantity, is_available, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
        RETURNING *`,
        [resort_id, name, type, capacity, beds, bedrooms || 1, bathrooms || 1,
         size_sqm, price_per_night, discount_price, description, 
         amenities || [], image_url || null, quantity || 1, is_available !== false]
      );
      
      res.status(201).json({
        success: true,
        message: 'Өрөө амжилттай нэмэгдлээ',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Create unit error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== UPDATE UNIT ====================
  async updateUnit(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const owner_id = req.userId;
      const userRole = req.user?.role_name;
      
      // Check ownership
      const unitCheck = await query(
        `SELECT u.*, r.owner_id 
         FROM units u
         JOIN resorts r ON u.resort_id = r.id
         WHERE u.id = $1`,
        [id]
      );
      
      if (unitCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Өрөө олдсонгүй' });
      }
      
      if (unitCheck.rows[0].owner_id !== owner_id && userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Энэ үйлдлийг хийх эрхгүй' });
      }
      
      const allowedFields = [
        'name', 'type', 'capacity', 'beds', 'bedrooms', 'bathrooms',
        'size_sqm', 'price_per_night', 'discount_price', 'description',
        'amenities', 'image_url', 'quantity', 'is_available'
      ];
      
      const setClauses = [];
      const values = [];
      let paramCount = 1;
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          setClauses.push(`${field} = $${paramCount++}`);
          values.push(updates[field]);
        }
      }
      
      if (setClauses.length === 0) {
        return res.status(400).json({ success: false, message: 'Шинэчлэх мэдээлэл байхгүй байна' });
      }
      
      setClauses.push(`updated_at = NOW()`);
      values.push(id);
      
      const result = await query(
        `UPDATE units SET ${setClauses.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );
      
      res.json({
        success: true,
        message: 'Өрөө амжилттай шинэчлэгдлээ',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Update unit error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== DELETE UNIT ====================
  async deleteUnit(req, res) {
    try {
      const { id } = req.params;
      const owner_id = req.userId;
      const userRole = req.user?.role_name;
      
      const unitCheck = await query(
        `SELECT u.*, r.owner_id 
         FROM units u
         JOIN resorts r ON u.resort_id = r.id
         WHERE u.id = $1`,
        [id]
      );
      
      if (unitCheck.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Өрөө олдсонгүй' });
      }
      
      if (unitCheck.rows[0].owner_id !== owner_id && userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Энэ үйлдлийг хийх эрхгүй' });
      }
      
      await query(`DELETE FROM units WHERE id = $1`, [id]);
      
      res.json({
        success: true,
        message: 'Өрөө амжилттай устгагдлаа'
      });
    } catch (error) {
      console.error('Delete unit error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== CHECK AVAILABILITY ====================
  async checkAvailability(req, res) {
    try {
      const { unitId, startDate, endDate } = req.query;
      
      if (!unitId || !startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'unitId, startDate, endDate шаардлагатай' });
      }
      
      const bookingsResult = await query(
        `SELECT COUNT(*) as booked_count
         FROM bookings
         WHERE unit_id = $1 
           AND status NOT IN ('cancelled', 'rejected')
           AND (
             (start_date <= $2 AND end_date >= $2) OR
             (start_date <= $3 AND end_date >= $3) OR
             (start_date >= $2 AND end_date <= $3)
           )`,
        [unitId, startDate, endDate]
      );
      
      const unitResult = await query(
        `SELECT quantity, price_per_night, discount_price FROM units WHERE id = $1`,
        [unitId]
      );
      
      if (unitResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Өрөө олдсонгүй' });
      }
      
      const quantity = unitResult.rows[0]?.quantity || 1;
      const bookedCount = parseInt(bookingsResult.rows[0].booked_count) || 0;
      const available = bookedCount < quantity;
      
      res.json({
        success: true,
        data: {
          available,
          bookedCount,
          quantity,
          availableCount: quantity - bookedCount,
          price: unitResult.rows[0]?.price_per_night,
          discountPrice: unitResult.rows[0]?.discount_price
        }
      });
    } catch (error) {
      console.error('Check availability error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }
}

module.exports = new UnitController();