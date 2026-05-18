// backend/routes/adminStats.js
const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const { query } = require('../config/database');

// Admin статистик
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { range = 'week' } = req.query;
    
    // Өөр өөр хэмжүүрийн дагуу query
    let dateFilter = '';
    switch(range) {
      case 'week':
        dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND created_at >= NOW() - INTERVAL '365 days'";
        break;
      default:
        dateFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
    }

    // Нийт амралтын газар
    const resortsQuery = await query(
      `SELECT COUNT(*) as total FROM resorts WHERE status = 'approved'`
    );

    // Нийт захиалга
    const bookingsQuery = await query(
      `SELECT COUNT(*) as total FROM bookings WHERE 1=1 ${dateFilter}`
    );

    // Нийт хэрэглэгч
    const usersQuery = await query(
      `SELECT COUNT(*) as total FROM users`
    );

    // Нийт орлого
    const revenueQuery = await query(
      `SELECT COALESCE(SUM(total_price), 0) as total 
       FROM bookings 
       WHERE status = 'confirmed' ${dateFilter}`
    );

    // Дундаж үнэлгээ
    const ratingQuery = await query(
      `SELECT COALESCE(AVG(rating), 0) as average 
       FROM reviews WHERE status = 'approved'`
    );

    // Хүлээгдэж буй амралтын газар
    const pendingQuery = await query(
      `SELECT COUNT(*) as total FROM resorts WHERE status = 'pending'`
    );

    res.json({
      success: true,
      data: {
        totalResorts: parseInt(resortsQuery.rows[0]?.total || 0),
        totalBookings: parseInt(bookingsQuery.rows[0]?.total || 0),
        totalUsers: parseInt(usersQuery.rows[0]?.total || 0),
        totalRevenue: parseFloat(revenueQuery.rows[0]?.total || 0),
        averageRating: parseFloat(ratingQuery.rows[0]?.average || 0),
        pendingResorts: parseInt(pendingQuery.rows[0]?.total || 0)
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Серверийн алдаа' 
    });
  }
});

// Сүүлийн захиалгууд
router.get('/recent-bookings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT b.id, b.total_price as amount, b.status, 
              b.check_in, b.check_out, b.created_at,
              u.name as customer_name, u.email as customer_email,
              r.name as resort_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN resorts r ON b.resort_id = r.id
       ORDER BY b.created_at DESC
       LIMIT 10`
    );

    // Форматлах
    const bookings = result.rows.map(booking => ({
      id: booking.id,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      resortName: booking.resort_name,
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      amount: booking.amount,
      status: booking.status,
      createdAt: booking.created_at
    }));

    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Recent bookings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Серверийн алдаа' 
    });
  }
});

// Орлого график (таны existing код)
router.get('/revenue', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { range = 'week' } = req.query;
    
    let interval, dateTrunc;
    switch(range) {
      case 'day': 
        interval = "hour";
        dateTrunc = "hour";
        break;
      case 'week': 
        interval = "day";
        dateTrunc = "day";
        break;
      case 'month': 
        interval = "day";
        dateTrunc = "day";
        break;
      case 'year': 
        interval = "month";
        dateTrunc = "month";
        break;
      default: 
        interval = "day";
        dateTrunc = "day";
    }

    const result = await query(
      `SELECT date_trunc($1, created_at) AS period, 
              SUM(total_price) AS revenue
       FROM bookings
       WHERE status = 'confirmed'
       GROUP BY period
       ORDER BY period ASC`,
      [interval]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Revenue endpoint error:', error);
    res.status(500).json({ success: false, message: 'Серверийн алдаа' });
  }
});

module.exports = router;