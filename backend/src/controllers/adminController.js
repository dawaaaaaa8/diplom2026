const { query } = require('../config/database');

class AdminController {
  // ==================== GET PENDING RESORT OWNERS ====================
  async getPendingOwners(req, res) {
    try {
      const result = await query(
        `SELECT id, name, email, phone, company_name, business_registration, 
                address, city, owner_status, created_at
         FROM users 
         WHERE role_id = (SELECT id FROM roles WHERE name = 'resort_owner')
         AND owner_status = 'pending'
         ORDER BY created_at ASC`
      );
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get pending owners error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== APPROVE RESORT OWNER ====================
  async approveResortOwner(req, res) {
    try {
      const { id } = req.params;
      
      const result = await query(
        `UPDATE users 
         SET owner_status = 'approved', 
             approved_at = NOW(),
             approved_by = $2,
             updated_at = NOW()
         WHERE id = $1 AND role_id = (SELECT id FROM roles WHERE name = 'resort_owner')
         RETURNING id, name, email, owner_status`,
        [id, req.userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Хэрэглэгч олдсонгүй' });
      }
      
      res.json({
        success: true,
        message: 'Амралтын газар эзэмшигч амжилттай баталгаажлаа',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Approve resort owner error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== REJECT RESORT OWNER ====================
  async rejectResortOwner(req, res) {
    try {
      const { id } = req.params;
      
      const result = await query(
        `UPDATE users 
         SET owner_status = 'rejected', updated_at = NOW()
         WHERE id = $1 AND role_id = (SELECT id FROM roles WHERE name = 'resort_owner')
         RETURNING id, name, email, owner_status`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Хэрэглэгч олдсонгүй' });
      }
      
      res.json({
        success: true,
        message: 'Амралтын газар эзэмшигчийн хүсэлтийг татгалзлаа',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Reject resort owner error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== GET ALL RESORTS (ADMIN) ====================
  async getAllResortsAdmin(req, res) {
    try {
      const result = await query(
        `SELECT r.*, u.name as owner_name, u.email as owner_email,
                l.province, l.city
         FROM resorts r
         LEFT JOIN users u ON r.owner_id = u.id
         LEFT JOIN locations l ON r.location_id = l.id
         ORDER BY r.created_at DESC`
      );
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get all resorts admin error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== GET PENDING RESORTS ====================
  async getPendingResorts(req, res) {
    try {
      const result = await query(
        `SELECT r.*, 
                u.name as owner_name, u.email, u.phone, u.city,
                c.name as category_name,
                rt.name_mn as resort_type_name
         FROM resorts r
         LEFT JOIN users u ON r.owner_id = u.id
         LEFT JOIN categories c ON r.category_id = c.id
         LEFT JOIN resort_types rt ON r.resort_type_id = rt.id
         WHERE r.is_approved = false OR r.is_approved IS NULL
         ORDER BY r.created_at ASC`
      );
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get pending resorts error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== APPROVE RESORT ====================
  async approveResort(req, res) {
    try {
      const { id } = req.params;
      
      const result = await query(
        `UPDATE resorts 
         SET is_approved = true, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Амралтын газар олдсонгүй' });
      }
      
      res.json({
        success: true,
        message: 'Амралтын газар амжилттай баталгаажлаа',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Approve resort error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== REJECT RESORT ====================
  async rejectResort(req, res) {
    try {
      const { id } = req.params;
      
      // Check if resort exists
      const checkResult = await query(
        `SELECT id, name FROM resorts WHERE id = $1`,
        [id]
      );
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Амралтын газар олдсонгүй' });
      }
      
      // Delete the resort (or update status to rejected)
      await query(
        `DELETE FROM resorts WHERE id = $1`,
        [id]
      );
      
      res.json({
        success: true,
        message: 'Амралтын газрын хүсэлтийг татгалзлаа',
        data: { id, name: checkResult.rows[0].name }
      });
    } catch (error) {
      console.error('Reject resort error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== GET RESORT DETAILS BY ID ====================
  async getResortDetails(req, res) {
    try {
      const { id } = req.params;
      
      const result = await query(
        `SELECT r.*, 
                u.name as owner_name, u.email, u.phone, u.city,
                c.name as category_name,
                rt.name_mn as resort_type_name,
                l.province, l.city as location_city
         FROM resorts r
         LEFT JOIN users u ON r.owner_id = u.id
         LEFT JOIN categories c ON r.category_id = c.id
         LEFT JOIN resort_types rt ON r.resort_type_id = rt.id
         LEFT JOIN locations l ON r.location_id = l.id
         WHERE r.id = $1`,
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Амралтын газар олдсонгүй' });
      }
      
      // Get units for this resort
      const unitsResult = await query(
        `SELECT * FROM units WHERE resort_id = $1`,
        [id]
      );
      
      const resort = result.rows[0];
      resort.units = unitsResult.rows;
      
      res.json({ success: true, data: resort });
    } catch (error) {
      console.error('Get resort details error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== GET DASHBOARD STATS ====================
  async getDashboardStats(req, res) {
    try {
      // Total users
      const usersResult = await query(`SELECT COUNT(*) as count FROM users`);
      
      // Total resorts
      const resortsResult = await query(`SELECT COUNT(*) as count FROM resorts`);
      
      // Total bookings
      const bookingsResult = await query(`SELECT COUNT(*) as count FROM bookings`);
      
      // Pending owners
      const pendingOwnersResult = await query(
        `SELECT COUNT(*) as count FROM users 
         WHERE role_id = (SELECT id FROM roles WHERE name = 'resort_owner') 
         AND owner_status = 'pending'`
      );
      
      // Pending resorts
      const pendingResortsResult = await query(
        `SELECT COUNT(*) as count FROM resorts WHERE is_approved = false`
      );
      
      // Monthly revenue
      const revenueResult = await query(
        `SELECT COALESCE(SUM(total_price), 0) as total 
         FROM bookings 
         WHERE status = 'confirmed' 
         AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`
      );
      
      res.json({
        success: true,
        data: {
          totalUsers: parseInt(usersResult.rows[0].count),
          totalResorts: parseInt(resortsResult.rows[0].count),
          totalBookings: parseInt(bookingsResult.rows[0].count),
          pendingOwners: parseInt(pendingOwnersResult.rows[0].count),
          pendingResorts: parseInt(pendingResortsResult.rows[0].count),
          monthlyRevenue: parseFloat(revenueResult.rows[0].total)
        }
      });
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== GET ALL USERS ====================
  async getAllUsers(req, res) {
    try {
      const result = await query(
        `SELECT u.id, u.name, u.email, u.phone, u.role_id, u.created_at,
                r.name as role_name
         FROM users u
         LEFT JOIN roles r ON u.role_id = r.id
         ORDER BY u.created_at DESC`
      );
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }

  // ==================== GET ALL BOOKINGS ====================
  async getAllBookings(req, res) {
    try {
      const result = await query(
        `SELECT b.*, 
                u.name as user_name, u.email as user_email,
                r.name as resort_name,
                ut.name as unit_name
         FROM bookings b
         LEFT JOIN users u ON b.user_id = u.id
         LEFT JOIN units ut ON b.unit_id = ut.id
         LEFT JOIN resorts r ON ut.resort_id = r.id
         ORDER BY b.created_at DESC`
      );
      
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Get all bookings error:', error);
      res.status(500).json({ success: false, message: 'Серверийн алдаа гарлаа' });
    }
  }
}

module.exports = new AdminController();