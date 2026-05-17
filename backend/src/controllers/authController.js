const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

class AuthController {
  // ==================== REGISTER ====================
  async register(req, res) {
    try {
      const { 
        name, email, password, phone, role_name = 'user',
        company_name, business_registration, address, city 
      } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Нэр, имэйл, нууц үг шаардлагатай'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой'
        });
      }

      // Check if email exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Энэ имэйл хаяг бүртгэлтэй байна'
        });
      }

      // Get role ID
      const roleResult = await query(
        'SELECT id FROM roles WHERE name = $1',
        [role_name]
      );

      if (roleResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Буруу хэрэглэгчийн төрөл'
        });
      }

      const roleId = roleResult.rows[0].id;
      const hashedPassword = await bcrypt.hash(password, 10);

      let result;
      
      if (role_name === 'resort_owner') {
        // Resort owner registration with additional fields
        result = await query(
          `INSERT INTO users (
            name, email, password, phone, role_id, 
            company_name, business_registration, address, city, owner_status,
            created_at, updated_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW(), NOW()) 
          RETURNING id, name, email, phone, role_id, company_name, business_registration, address, city, owner_status, created_at`,
          [name, email.toLowerCase(), hashedPassword, phone, roleId, 
           company_name, business_registration, address, city || 'Ulaanbaatar']
        );
      } else {
        // Regular user registration
        result = await query(
          `INSERT INTO users (name, email, password, phone, role_id, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
           RETURNING id, name, email, phone, role_id, created_at`,
          [name, email.toLowerCase(), hashedPassword, phone, roleId]
        );
      }

      const user = result.rows[0];

      // Get role info
      const roleInfo = await query(
        `SELECT r.name as role_name, r.permissions 
         FROM roles r 
         WHERE r.id = $1`,
        [user.role_id]
      );

      if (roleInfo.rows.length > 0) {
        user.role_name = roleInfo.rows[0].role_name;
        user.permissions = roleInfo.rows[0].permissions;
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id, role: user.role_name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const message = role_name === 'resort_owner' 
        ? 'Таны бүртгэлийг админ баталгаажуулах хүртэл хүлээнэ үү'
        : 'Амжилттай бүртгэгдлээ';

      res.status(201).json({
        success: true,
        message: message,
        data: { user, token }
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа гарлаа'
      });
    }
  }

  // ==================== LOGIN ====================
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Имэйл, нууц үг шаардлагатай'
        });
      }

      const result = await query(
        `SELECT u.*, r.name as role_name, r.permissions 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.email = $1`,
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Имэйл эсвэл нууц үг буруу'
        });
      }

      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Имэйл эсвэл нууц үг буруу'
        });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role_name },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: 'Амжилттай нэвтэрлээ',
        data: { user: userWithoutPassword, token }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа гарлаа'
      });
    }
  }

  // ==================== GET PROFILE ====================
  async getProfile(req, res) {
    try {
      const result = await query(
        `SELECT u.id, u.name, u.email, u.phone, u.avatar_url, 
                u.email_verified, u.created_at, u.updated_at,
                u.company_name, u.business_registration, u.address, u.city, u.owner_status,
                r.name as role_name, r.permissions
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1`,
        [req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Хэрэглэгч олдсонгүй'
        });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Серверийн алдаа гарлаа'
      });
    }
  }
}

module.exports = new AuthController();