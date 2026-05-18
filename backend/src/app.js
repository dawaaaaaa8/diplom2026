const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Route импорт
const authRoutes = require('./routes/authRoutes');
const resortRoutes = require('./routes/resortRoutes');
const adminRoutes = require('./routes/adminRoutes'); // ← Шинээр нэмнэ

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/resorts', resortRoutes);
app.use('/api/admin', adminRoutes); // ← Шинээр нэмнэ
app.use('/api/resort-owner', require('./routes/resortOwnerRoutes'));
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Travel Booking API ажиллаж байна'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint олдсонгүй'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Серверийн алдаа';
  
  res.status(statusCode).json({
    success: false,
    message: message
  });
});

module.exports = app;