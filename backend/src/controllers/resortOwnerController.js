const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class ResortOwnerController {
  // ==================== REGISTRATION ====================
  async registerResortOwner(req, res) {
    try {
      const { 
        name, 
        email, 
        password, 
        phone, 
        company_name,
        business_registration,
        address,
        city 
      } = req.body;

      // Validation
      if (!name || !email || !password || !company_name) {
        return res.status(400).json({
          success: false,
          message: 'Шаардлагатай мэдээллийг бүрэн оруулна уу'
        });
      }

      // Check existing user
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Бүртгэлтэй имэйл хаяг байна'
        });
      }

      // Get resort_owner role ID
      let roleId;
      const roleResult = await query(
        'SELECT id FROM roles WHERE name = $1',
        ['resort_owner']
      );

      if (roleResult.rows.length === 0) {
        // Create resort_owner role if it doesn't exist
        const newRole = await query(
          `INSERT INTO roles (name, description, permissions, created_at, updated_at) 
           VALUES ($1, $2, $3, NOW(), NOW()) 
           RETURNING id`,
          ['resort_owner', 'Resort owner can manage resorts and bookings', 
           '["manage_resorts", "manage_bookings", "view_revenue", "manage_units"]']
        );
        roleId = newRole.rows[0].id;
      } else {
        roleId = roleResult.rows[0].id;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Start transaction
      await query('BEGIN');

      try {
        // Create user
        const userResult = await query(
          `INSERT INTO users (
            name, email, password, phone, role_id,
            company_name, business_registration, address, city, owner_status,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW(), NOW())
          RETURNING id, name, email, phone, role_id, created_at, 
                    company_name, owner_status, address, city`,
          [name, email, hashedPassword, phone, roleId, 
           company_name, business_registration, address, city]
        );

        const user = userResult.rows[0];

        await query('COMMIT');

        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: user.id, 
            role: 'resort_owner',
            email: user.email 
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        res.status(201).json({
          success: true,
          message: 'Амжилттай бүртгэгдлээ. Таны бүртгэлийг шалгаж баталгаажуулна.',
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: 'resort_owner',
              role_id: user.role_id,
              company_name: user.company_name,
              owner_status: user.owner_status,
              address: user.address,
              city: user.city
            },
            token
          }
        });

      } catch (error) {
        await query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Resort owner registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа'
      });
    }
  }

  // ==================== LOGIN ====================
  async loginResortOwner(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Имэйл болон нууц үгээ оруулна уу'
        });
      }

      // Get user with role
      const userResult = await query(
        `SELECT u.*, r.name as role_name, r.permissions
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.email = $1 AND r.name = 'resort_owner'`,
        [email]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Имэйл эсвэл нууц үг буруу байна'
        });
      }

      const user = userResult.rows[0];

      // Check if owner is approved
      if (user.owner_status === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Таны бүртгэл шалгагдаж байна. Түр хүлээнэ үү.'
        });
      }

      if (user.owner_status === 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Таны бүртгэл баталгаажаагүй байна. Админтай холбогдоно уу.'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Имэйл эсвэл нууц үг буруу байна'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          role: 'resort_owner',
          email: user.email
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Амжилттай нэвтэрлээ',
        data: {
          user: userWithoutPassword,
          token
        }
      });

    } catch (error) {
      console.error('Resort owner login error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа'
      });
    }
  }

  // ==================== DASHBOARD STATS ====================
  async getDashboardStats(req, res) {
    try {
      const ownerId = req.user.id;

      // Get resorts count
      const resortsResult = await query(
        `SELECT 
           COUNT(*) as total_resorts,
           COUNT(CASE WHEN is_approved = true THEN 1 END) as approved_resorts,
           COUNT(CASE WHEN is_approved = false THEN 1 END) as pending_resorts
         FROM resorts 
         WHERE owner_id = $1`,
        [ownerId]
      );

      // Get units and bookings stats
      const unitsResult = await query(
        `SELECT 
           COUNT(DISTINCT u.id) as total_units,
           COUNT(DISTINCT b.id) as total_bookings,
           COUNT(DISTINCT CASE WHEN b.status = 'pending' THEN b.id END) as pending_bookings,
           COUNT(DISTINCT CASE WHEN b.status = 'confirmed' THEN b.id END) as confirmed_bookings,
           COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
           COALESCE(SUM(b.total_price), 0) as total_revenue,
           COALESCE(SUM(CASE WHEN DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', CURRENT_DATE)
                        THEN b.total_price ELSE 0 END), 0) as monthly_revenue
         FROM resorts r
         LEFT JOIN units u ON r.id = u.resort_id
         LEFT JOIN bookings b ON u.id = b.unit_id AND b.status = 'completed'
         WHERE r.owner_id = $1`,
        [ownerId]
      );

      // Get recent bookings - FIXED: removed booking_number
      const recentBookings = await query(
        `SELECT 
           b.id,
           b.status,
           b.total_price,
           b.created_at,
           b.start_date,
           b.end_date,
           b.guests,
           u.type as unit_type,
           r.name as resort_name,
           users.name as customer_name,
           users.email as customer_email
         FROM bookings b
         JOIN units u ON b.unit_id = u.id
         JOIN resorts r ON u.resort_id = r.id
         JOIN users ON b.user_id = users.id
         WHERE r.owner_id = $1
         ORDER BY b.created_at DESC
         LIMIT 10`,
        [ownerId]
      );

      // Get monthly revenue for chart
      const monthlyRevenue = await query(
        `SELECT 
           TO_CHAR(DATE_TRUNC('month', b.created_at), 'YYYY-MM') as month,
           COUNT(DISTINCT b.id) as bookings_count,
           COALESCE(SUM(b.total_price), 0) as revenue
         FROM resorts r
         JOIN units u ON r.id = u.resort_id
         JOIN bookings b ON u.id = b.unit_id
         WHERE r.owner_id = $1 
           AND b.status = 'completed'
           AND b.created_at >= NOW() - INTERVAL '12 months'
         GROUP BY DATE_TRUNC('month', b.created_at)
         ORDER BY month DESC`,
        [ownerId]
      );

      // Get resort performance
      const resortPerformance = await query(
        `SELECT 
           r.id,
           r.name,
           r.is_approved,
           COUNT(DISTINCT u.id) as total_units,
           COUNT(DISTINCT b.id) as total_bookings,
           COALESCE(SUM(b.total_price), 0) as total_revenue,
           COALESCE(AVG(br.rating), 0) as avg_rating,
           COUNT(DISTINCT br.id) as review_count
         FROM resorts r
         LEFT JOIN units u ON r.id = u.resort_id
         LEFT JOIN bookings b ON u.id = b.unit_id AND b.status = 'completed'
         LEFT JOIN bookings_reviews br ON b.id = br.booking_id
         WHERE r.owner_id = $1
         GROUP BY r.id
         ORDER BY total_bookings DESC`,
        [ownerId]
      );

      res.json({
        success: true,
        data: {
          summary: {
            total_resorts: parseInt(resortsResult.rows[0]?.total_resorts) || 0,
            approved_resorts: parseInt(resortsResult.rows[0]?.approved_resorts) || 0,
            pending_resorts: parseInt(resortsResult.rows[0]?.pending_resorts) || 0,
            total_units: parseInt(unitsResult.rows[0]?.total_units) || 0,
            total_bookings: parseInt(unitsResult.rows[0]?.total_bookings) || 0,
            pending_bookings: parseInt(unitsResult.rows[0]?.pending_bookings) || 0,
            confirmed_bookings: parseInt(unitsResult.rows[0]?.confirmed_bookings) || 0,
            completed_bookings: parseInt(unitsResult.rows[0]?.completed_bookings) || 0,
            total_revenue: parseFloat(unitsResult.rows[0]?.total_revenue) || 0,
            monthly_revenue: parseFloat(unitsResult.rows[0]?.monthly_revenue) || 0
          },
          recent_bookings: recentBookings.rows,
          monthly_revenue_chart: monthlyRevenue.rows,
          resort_performance: resortPerformance.rows
        }
      });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа'
      });
    }
  }

  // ==================== GET MY RESORTS ====================
  async getMyResorts(req, res) {
    try {
      const ownerId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const result = await query(
        `SELECT 
           r.*,
           l.province,
           l.city,
           c.name as category_name,
           COUNT(DISTINCT u.id) as total_units,
           COALESCE(AVG(br.rating), 0) as avg_rating,
           COUNT(DISTINCT br.id) as review_count,
           COUNT(DISTINCT b.id) as total_bookings
         FROM resorts r
         LEFT JOIN locations l ON r.location_id = l.id
         LEFT JOIN categories c ON r.category_id = c.id
         LEFT JOIN units u ON r.id = u.resort_id
         LEFT JOIN bookings b ON u.id = b.unit_id
         LEFT JOIN bookings_reviews br ON b.id = br.booking_id
         WHERE r.owner_id = $1
         GROUP BY r.id, l.id, c.id
         ORDER BY r.created_at DESC
         LIMIT $2 OFFSET $3`,
        [ownerId, limit, offset]
      );

      // Get total count
      const countResult = await query(
        'SELECT COUNT(*) FROM resorts WHERE owner_id = $1',
        [ownerId]
      );

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      });

    } catch (error) {
      console.error('Get resorts error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа'
      });
    }
  }

  // ==================== CREATE RESORT ====================
  async createResort(req, res) {
    try {
      const ownerId = req.user.id;
      const {
        name,
        description,
        address,
        location_id,
        category_id,
        is_featured = false
      } = req.body;

      if (!name || !description || !address) {
        return res.status(400).json({
          success: false,
          message: 'Амралтын газрын нэр, тайлбар, хаяг шаардлагатай'
        });
      }

      const result = await query(
        `INSERT INTO resorts (
          name, description, address, location_id, category_id, 
          owner_id, is_featured, is_approved, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW(), NOW())
        RETURNING *`,
        [name, description, address, location_id, category_id, ownerId, is_featured]
      );

      res.status(201).json({
        success: true,
        message: 'Амралтын газар амжилттай нэмэгдлээ. Админы баталгаажуулалт хүлээнэ үү.',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Create resort error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа'
      });
    }
  }

  // ==================== UPDATE RESORT ====================
  async updateResort(req, res) {
    try {
      const ownerId = req.user.id;
      const resortId = req.params.id;
      const updates = req.body;

      // Check ownership
      const resortCheck = await query(
        'SELECT * FROM resorts WHERE id = $1 AND owner_id = $2',
        [resortId, ownerId]
      );

      if (resortCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Амралтын газар олдсонгүй'
        });
      }

      // Build update query
      const allowedFields = ['name', 'description', 'address', 'location_id', 'category_id', 'is_featured'];
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(updates[key]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Шинэчлэх мэдээлэл олдсонгүй'
        });
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(resortId, ownerId);

      const queryText = `
        UPDATE resorts 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND owner_id = $${paramIndex + 1}
        RETURNING *
      `;

      const result = await query(queryText, values);

      res.json({
        success: true,
        message: 'Амралтын газрын мэдээлэл шинэчлэгдлээ',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Update resort error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа'
      });
    }
  }

  // ==================== GET RESORT UNITS ====================
  async getResortUnits(req, res) {
    try {
      const ownerId = req.user.id;
      const resortId = req.params.resortId;

      // Check ownership
      const resortCheck = await query(
        'SELECT id FROM resorts WHERE id = $1 AND owner_id = $2',
        [resortId, ownerId]
      );

      if (resortCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Амралтын газар олдсонгүй'
        });
      }

      const result = await query(
        `SELECT 
           u.*,
           COUNT(DISTINCT b.id) as total_bookings,
           COALESCE(AVG(br.rating), 0) as avg_rating,
           json_agg(DISTINCT ui.image_url) as images
         FROM units u
         LEFT JOIN bookings b ON u.id = b.unit_id
         LEFT JOIN bookings_reviews br ON b.id = br.booking_id
         LEFT JOIN unit_images ui ON u.id = ui.unit_id AND ui.is_primary = true
         WHERE u.resort_id = $1
         GROUP BY u.id
         ORDER BY u.created_at DESC`,
        [resortId]
      );

      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Get units error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа'
      });
    }
  }

  // ==================== CREATE UNIT ====================
  async createUnit(req, res) {
    try {
      const ownerId = req.user.id;
      const resortId = req.params.resortId;
      const {
        type,
        capacity,
        beds,
        price_per_night,
        description,
        amenities = [],
        is_available = true
      } = req.body;

      // Validation
      if (!type || !capacity || !beds || !price_per_night) {
        return res.status(400).json({
          success: false,
          message: 'Байрны төрөл, багтаамж, орны тоо, үнэ шаардлагатай'
        });
      }

      // Check ownership
      const resortCheck = await query(
        'SELECT id FROM resorts WHERE id = $1 AND owner_id = $2',
        [resortId, ownerId]
      );

      if (resortCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Амралтын газар олдсонгүй'
        });
      }

      const result = await query(
        `INSERT INTO units (
          resort_id, type, capacity, beds, price_per_night, 
          description, amenities, is_available, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *`,
        [resortId, type, capacity, beds, price_per_night, description, amenities, is_available]
      );

      res.status(201).json({
        success: true,
        message: 'Байр амжилттай нэмэгдлээ',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Create unit error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа'
      });
    }
  }

  // ==================== UPDATE UNIT ====================
  async updateUnit(req, res) {
    try {
      const ownerId = req.user.id;
      const unitId = req.params.unitId;
      const updates = req.body;

      // Check ownership
      const unitCheck = await query(
        `SELECT u.* FROM units u
         JOIN resorts r ON u.resort_id = r.id
         WHERE u.id = $1 AND r.owner_id = $2`,
        [unitId, ownerId]
      );

      if (unitCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Байр олдсонгүй'
        });
      }

      // Build update query
      const allowedFields = ['type', 'capacity', 'beds', 'price_per_night', 'description', 'amenities', 'is_available'];
      const updateFields = [];
      const values = [];
      let paramIndex = 1;

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          updateFields.push(`${key} = $${paramIndex}`);
          values.push(updates[key]);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Шинэчлэх мэдээлэл олдсонгүй'
        });
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(unitId);

      const queryText = `
        UPDATE units 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await query(queryText, values);

      res.json({
        success: true,
        message: 'Байрны мэдээлэл шинэчлэгдлээ',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Update unit error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа'
      });
    }
  }

  // ==================== GET BOOKINGS ====================
  async getBookings(req, res) {
    try {
      const ownerId = req.user.id;
      const { status, resort_id, page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      let queryText = `
        SELECT 
          b.id,
          b.status,
          b.total_price,
          b.created_at,
          b.start_date,
          b.end_date,
          b.guests,
          u.type as unit_type,
          u.price_per_night,
          r.name as resort_name,
          users.name as customer_name,
          users.email as customer_email,
          users.phone as customer_phone
        FROM bookings b
        JOIN units u ON b.unit_id = u.id
        JOIN resorts r ON u.resort_id = r.id
        JOIN users ON b.user_id = users.id
        WHERE r.owner_id = $1
      `;

      const params = [ownerId];
      let paramIndex = 2;

      if (status) {
        queryText += ` AND b.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (resort_id) {
        queryText += ` AND r.id = $${paramIndex}`;
        params.push(resort_id);
        paramIndex++;
      }

      queryText += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await query(queryText, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) 
        FROM bookings b
        JOIN units u ON b.unit_id = u.id
        JOIN resorts r ON u.resort_id = r.id
        WHERE r.owner_id = $1
      `;
      
      const countParams = [ownerId];
      
      if (status) {
        countQuery += ` AND b.status = $2`;
        countParams.push(status);
      }

      const countResult = await query(countQuery, countParams);

      res.json({
        success: true,
        data: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      });

    } catch (error) {
      console.error('Get bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа'
      });
    }
  }

  // ==================== UPDATE BOOKING STATUS ====================
  async updateBookingStatus(req, res) {
    try {
      const ownerId = req.user.id;
      const bookingId = req.params.id;
      const { status } = req.body;

      // Check permission
      const bookingCheck = await query(
        `SELECT b.* FROM bookings b
         JOIN units u ON b.unit_id = u.id
         JOIN resorts r ON u.resort_id = r.id
         WHERE b.id = $1 AND r.owner_id = $2`,
        [bookingId, ownerId]
      );

      if (bookingCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Захиалга олдсонгүй'
        });
      }

      const result = await query(
        `UPDATE bookings 
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [status, bookingId]
      );

      res.json({
        success: true,
        message: 'Захиалгын төлөв шинэчлэгдлээ',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Update booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа'
      });
    }
  }

  // ==================== GET REVENUE REPORT ====================
  async getRevenueReport(req, res) {
    try {
      const ownerId = req.user.id;
      const { period = 'monthly', year = new Date().getFullYear() } = req.query;

      let queryText = '';
      let groupBy = '';

      switch(period) {
        case 'daily':
          queryText = `
            SELECT 
              TO_CHAR(b.created_at, 'YYYY-MM-DD') as date,
              COUNT(DISTINCT b.id) as bookings,
              COALESCE(SUM(b.total_price), 0) as revenue
          `;
          groupBy = 'GROUP BY DATE(b.created_at) ORDER BY date DESC';
          break;
        case 'monthly':
          queryText = `
            SELECT 
              TO_CHAR(DATE_TRUNC('month', b.created_at), 'YYYY-MM') as month,
              COUNT(DISTINCT b.id) as bookings,
              COALESCE(SUM(b.total_price), 0) as revenue
          `;
          groupBy = 'GROUP BY DATE_TRUNC(\'month\', b.created_at) ORDER BY month DESC';
          break;
        case 'yearly':
          queryText = `
            SELECT 
              EXTRACT(YEAR FROM b.created_at) as year,
              COUNT(DISTINCT b.id) as bookings,
              COALESCE(SUM(b.total_price), 0) as revenue
          `;
          groupBy = 'GROUP BY EXTRACT(YEAR FROM b.created_at) ORDER BY year DESC';
          break;
        default:
          queryText = `
            SELECT 
              TO_CHAR(DATE_TRUNC('month', b.created_at), 'YYYY-MM') as month,
              COUNT(DISTINCT b.id) as bookings,
              COALESCE(SUM(b.total_price), 0) as revenue
          `;
          groupBy = 'GROUP BY DATE_TRUNC(\'month\', b.created_at) ORDER BY month DESC';
      }

      queryText += `
        FROM resorts r
        JOIN units u ON r.id = u.resort_id
        JOIN bookings b ON u.id = b.unit_id
        WHERE r.owner_id = $1
          AND b.status = 'completed'
          AND EXTRACT(YEAR FROM b.created_at) = $2
      ` + groupBy;

      const result = await query(queryText, [ownerId, year]);

      // Get summary
      const summary = await query(
        `SELECT 
           COALESCE(SUM(b.total_price), 0) as total_revenue,
           COUNT(DISTINCT b.id) as total_bookings,
           COUNT(DISTINCT r.id) as total_resorts,
           COUNT(DISTINCT u.id) as total_units
         FROM resorts r
         LEFT JOIN units u ON r.id = u.resort_id
         LEFT JOIN bookings b ON u.id = b.unit_id AND b.status = 'completed'
         WHERE r.owner_id = $1`,
        [ownerId]
      );

      res.json({
        success: true,
        data: {
          report: result.rows,
          summary: summary.rows[0],
          period,
          year
        }
      });

    } catch (error) {
      console.error('Revenue report error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа'
      });
    }
  }

  // ==================== GET PROFILE ====================
  async getProfile(req, res) {
    try {
      const ownerId = req.user.id;

      const result = await query(
        `SELECT 
           id, name, email, phone, avatar_url,
           company_name, business_registration, address, city,
           owner_status, created_at, updated_at
         FROM users 
         WHERE id = $1`,
        [ownerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Хэрэглэгч олдсонгүй'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа'
      });
    }
  }

  // ==================== UPDATE PROFILE ====================
  async updateProfile(req, res) {
    try {
      const ownerId = req.user.id;
      const { name, phone, address, city, company_name } = req.body;

      const result = await query(
        `UPDATE users 
         SET name = COALESCE($1, name),
             phone = COALESCE($2, phone),
             address = COALESCE($3, address),
             city = COALESCE($4, city),
             company_name = COALESCE($5, company_name),
             updated_at = NOW()
         WHERE id = $6
         RETURNING id, name, email, phone, address, city, company_name, owner_status`,
        [name, phone, address, city, company_name, ownerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Хэрэглэгч олдсонгүй'
        });
      }

      res.json({
        success: true,
        message: 'Профайл амжилттай шинэчлэгдлээ',
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа'
      });
    }
  }
}

module.exports = new ResortOwnerController();