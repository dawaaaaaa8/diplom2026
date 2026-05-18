const express = require('express');
const router = express.Router();

// Test endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database test
router.get('/db', async (req, res) => {
  try {
    const { query } = require('../config/database');
    const result = await query('SELECT NOW() as current_time');
    
    res.json({
      success: true,
      message: 'Database connected successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

module.exports = router;