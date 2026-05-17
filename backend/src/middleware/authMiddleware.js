// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Токен шаардлагатай'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // JWT verify хийх
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Database-ээс хэрэглэгчийн мэдээлэл авах
    const userResult = await query(
      'SELECT id, name, email, role_id FROM users WHERE id = $1',
      [decoded.userId || decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    req.user = userResult.rows[0];
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Хүчингүй токен'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Токены хугацаа дууссан'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Серверийн алдаа'
    });
  }
};

const adminMiddleware = (req, res, next) => {
  // Admin эрх шалгах (role_id = 2)
  if (req.user.role_id === 2) {
    return res.status(403).json({
      success: false,
      message: 'Админ эрхтэй байна'
    });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };