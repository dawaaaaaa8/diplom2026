const { query } = require('../config/database');

class ResortController {
  // ==================== GET ALL RESORTS ====================
  async getAllResorts(req, res) {
    try {
      const { featured, limit = 20, offset = 0 } = req.query;
      
      let sql = `
        SELECT r.*, 
               l.province, l.city,
               c.name as category_name,
               rt.name as resort_type_name,
               rt.name_mn as resort_type_name_mn,
               u.name as owner_name,
               COALESCE(r.cover_image, r.image_url, r.images[1], '/uploads/default-resort.jpg') as display_image
        FROM resorts r
        LEFT JOIN locations l ON r.location_id = l.id
        LEFT JOIN categories c ON r.category_id = c.id
        LEFT JOIN resort_types rt ON r.resort_type_id = rt.id
        LEFT JOIN users u ON r.owner_id = u.id
        WHERE r.is_approved = true
      `;
      
      const params = [];
      
      if (featured === 'true') {
        sql += ` AND r.is_featured = true`;
      }
      
      sql += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      const result = await query(sql, params);
      
      res.json({
        success: true,
        data: result.rows,
        pagination: { limit, offset, total: result.rowCount }
      });
    } catch (error) {
      console.error('Get resorts error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== GET RESORT BY ID ====================
  async getResortById(req, res) {
    try {
      const { id } = req.params;
      
      const result = await query(
        `SELECT r.*, 
                l.province, l.city, l.latitude, l.longitude,
                c.name as category_name,
                rt.name as resort_type_name,
                rt.name_mn as resort_type_name_mn,
                u.name as owner_name, u.phone as owner_phone,
                r.image_url as main_image,
                r.cover_image as cover,
                r.images as image_list,
                r.gallery as gallery_images
         FROM resorts r
         LEFT JOIN locations l ON r.location_id = l.id
         LEFT JOIN categories c ON r.category_id = c.id
         LEFT JOIN resort_types rt ON r.resort_type_id = rt.id
         LEFT JOIN users u ON r.owner_id = u.id
         WHERE r.id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Амралтын газар олдсонгүй' });
      }
      
      // Get units for this resort
      const unitsResult = await query(
        `SELECT * FROM units WHERE resort_id = $1 AND is_available = true`,
        [id]
      );
      
      const resort = result.rows[0];
      resort.units = unitsResult.rows;
      
      // Format images for frontend
      resort.all_images = [];
      if (resort.main_image) resort.all_images.push(resort.main_image);
      if (resort.cover && resort.cover !== resort.main_image) resort.all_images.push(resort.cover);
      if (resort.image_list && Array.isArray(resort.image_list)) {
        resort.all_images.push(...resort.image_list);
      }
      if (resort.gallery_images && Array.isArray(resort.gallery_images)) {
        resort.all_images.push(...resort.gallery_images);
      }
      
      // If no images, add default
      if (resort.all_images.length === 0) {
        resort.all_images.push('/uploads/default-resort.jpg');
      }
      
      res.json({ success: true, data: resort });
    } catch (error) {
      console.error('Get resort error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== CREATE RESORT (OWNER ONLY) ====================
  async createResort(req, res) {
    try {
      const { 
        name, description, address, location_id, category_id, resort_type_id,
        image_url, cover_image, images, gallery
      } = req.body;
      const owner_id = req.userId;
      
      // Check if user is approved resort owner
      const userCheck = await query(
        `SELECT owner_status FROM users WHERE id = $1`,
        [owner_id]
      );
      
      if (userCheck.rows.length === 0 || userCheck.rows[0]?.owner_status !== 'approved') {
        return res.status(403).json({
          success: false,
          message: 'Таны бүртгэл баталгаажаагүй байна. Эхлээд админаар баталгаажуулах шаардлагатай.'
        });
      }
      
      const result = await query(
        `INSERT INTO resorts (
          name, description, address, location_id, category_id, owner_id, resort_type_id,
          image_url, cover_image, images, gallery,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *`,
        [name, description, address, location_id, category_id, owner_id, resort_type_id,
         image_url || null, cover_image || null, images || [], gallery || []]
      );
      
      res.status(201).json({
        success: true,
        message: 'Амралтын газар амжилттай нэмэгдлээ',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Create resort error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== UPDATE RESORT ====================
  async updateResort(req, res) {
    try {
      const { id } = req.params;
      const { 
        name, description, address, location_id, category_id, resort_type_id,
        image_url, cover_image, images, gallery, is_featured, is_approved
      } = req.body;
      const owner_id = req.userId;
      const userRole = req.user?.role_name;
      
      // Check ownership or admin
      const check = await query(
        `SELECT owner_id FROM resorts WHERE id = $1`,
        [id]
      );
      
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Амралтын газар олдсонгүй' });
      }
      
      if (check.rows[0].owner_id !== owner_id && userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Энэ үйлдлийг хийх эрхгүй' });
      }
      
      // Build dynamic update query
      const updates = [];
      const values = [];
      let paramCount = 1;
      
      if (name !== undefined) {
        updates.push(`name = $${paramCount++}`);
        values.push(name);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount++}`);
        values.push(description);
      }
      if (address !== undefined) {
        updates.push(`address = $${paramCount++}`);
        values.push(address);
      }
      if (location_id !== undefined) {
        updates.push(`location_id = $${paramCount++}`);
        values.push(location_id);
      }
      if (category_id !== undefined) {
        updates.push(`category_id = $${paramCount++}`);
        values.push(category_id);
      }
      if (resort_type_id !== undefined) {
        updates.push(`resort_type_id = $${paramCount++}`);
        values.push(resort_type_id);
      }
      if (image_url !== undefined) {
        updates.push(`image_url = $${paramCount++}`);
        values.push(image_url);
      }
      if (cover_image !== undefined) {
        updates.push(`cover_image = $${paramCount++}`);
        values.push(cover_image);
      }
      if (images !== undefined) {
        updates.push(`images = $${paramCount++}`);
        values.push(images);
      }
      if (gallery !== undefined) {
        updates.push(`gallery = $${paramCount++}`);
        values.push(gallery);
      }
      if (is_featured !== undefined && userRole === 'admin') {
        updates.push(`is_featured = $${paramCount++}`);
        values.push(is_featured);
      }
      if (is_approved !== undefined && userRole === 'admin') {
        updates.push(`is_approved = $${paramCount++}`);
        values.push(is_approved);
      }
      
      updates.push(`updated_at = NOW()`);
      values.push(id);
      
      const result = await query(
        `UPDATE resorts SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        values
      );
      
      res.json({
        success: true,
        message: 'Амралтын газар амжилттай шинэчлэгдлээ',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Update resort error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== DELETE RESORT ====================
  async deleteResort(req, res) {
    try {
      const { id } = req.params;
      const owner_id = req.userId;
      const userRole = req.user?.role_name;
      
      // Check ownership or admin
      const check = await query(
        `SELECT owner_id FROM resorts WHERE id = $1`,
        [id]
      );
      
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Амралтын газар олдсонгүй' });
      }
      
      if (check.rows[0].owner_id !== owner_id && userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Энэ үйлдлийг хийх эрхгүй' });
      }
      
      await query(`DELETE FROM resorts WHERE id = $1`, [id]);
      
      res.json({
        success: true,
        message: 'Амралтын газар амжилттай устгагдлаа'
      });
    } catch (error) {
      console.error('Delete resort error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== GET OWNER RESORTS ====================
  async getOwnerResorts(req, res) {
    try {
      const result = await query(
        `SELECT r.*, 
                COUNT(DISTINCT b.id) as booking_count,
                COALESCE(r.cover_image, r.image_url, r.images[1], '/uploads/default-resort.jpg') as display_image
         FROM resorts r
         LEFT JOIN units u ON u.resort_id = r.id
         LEFT JOIN bookings b ON b.unit_id = u.id
         WHERE r.owner_id = $1
         GROUP BY r.id
         ORDER BY r.created_at DESC`,
        [req.userId]
      );
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get owner resorts error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== UPDATE RESORT IMAGES ====================
  async updateResortImages(req, res) {
    try {
      const { id } = req.params;
      const { image_url, cover_image, images, gallery } = req.body;
      const owner_id = req.userId;
      const userRole = req.user?.role_name;
      
      // Check ownership
      const check = await query(
        `SELECT owner_id FROM resorts WHERE id = $1`,
        [id]
      );
      
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Амралтын газар олдсонгүй' });
      }
      
      if (check.rows[0].owner_id !== owner_id && userRole !== 'admin') {
        return res.status(403).json({ success: false, message: 'Энэ үйлдлийг хийх эрхгүй' });
      }
      
      const result = await query(
        `UPDATE resorts 
         SET image_url = COALESCE($1, image_url),
             cover_image = COALESCE($2, cover_image),
             images = COALESCE($3, images),
             gallery = COALESCE($4, gallery),
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [image_url, cover_image, images, gallery, id]
      );
      
      res.json({
        success: true,
        message: 'Зургууд амжилттай шинэчлэгдлээ',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Update resort images error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== GET RESORTS BY LOCATION ====================
  async getResortsByLocation(req, res) {
    try {
      const { province, city } = req.query;
      
      let sql = `
        SELECT r.*, 
               l.province, l.city,
               COALESCE(r.cover_image, r.image_url, r.images[1], '/uploads/default-resort.jpg') as display_image
        FROM resorts r
        LEFT JOIN locations l ON r.location_id = l.id
        WHERE r.is_approved = true
      `;
      
      const params = [];
      
      if (province) {
        sql += ` AND l.province = $${params.length + 1}`;
        params.push(province);
      }
      
      if (city) {
        sql += ` AND l.city = $${params.length + 1}`;
        params.push(city);
      }
      
      sql += ` ORDER BY r.created_at DESC`;
      
      const result = await query(sql, params);
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get resorts by location error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== GET FEATURED RESORTS ====================
  async getFeaturedResorts(req, res) {
    try {
      const { limit = 6 } = req.query;
      
      const result = await query(
        `SELECT r.*, 
                l.province, l.city,
                COALESCE(r.cover_image, r.image_url, r.images[1], '/uploads/default-resort.jpg') as display_image
         FROM resorts r
         LEFT JOIN locations l ON r.location_id = l.id
         WHERE r.is_approved = true AND r.is_featured = true
         ORDER BY r.created_at DESC
         LIMIT $1`,
        [limit]
      );
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get featured resorts error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== SEARCH RESORTS ====================
  async searchResorts(req, res) {
    try {
      const { q, limit = 20 } = req.query;
      
      if (!q) {
        return res.json({ success: true, data: [] });
      }
      
      const result = await query(
        `SELECT r.*, 
                l.province, l.city,
                COALESCE(r.cover_image, r.image_url, r.images[1], '/uploads/default-resort.jpg') as display_image
         FROM resorts r
         LEFT JOIN locations l ON r.location_id = l.id
         WHERE r.is_approved = true 
           AND (r.name ILIKE $1 OR r.description ILIKE $1 OR r.address ILIKE $1)
         ORDER BY 
           CASE WHEN r.name ILIKE $1 THEN 1 ELSE 2 END,
           r.created_at DESC
         LIMIT $2`,
        [`%${q}%`, limit]
      );
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Search resorts error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }
}

module.exports = new ResortController();