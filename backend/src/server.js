const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const resortRoutes = require('./routes/resortRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const locationRoutes = require('./routes/locationRoutes');
const resortTypeRoutes = require('./routes/resortTypeRoutes');
const uploadRoutes = require('./routes/upload'); // ✅ Import
const reviewRoutes = require('./routes/reviewRoutes');
const unitRoutes = require('./routes/unitRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resorts', resortRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/reviews', reviewRoutes);

app.use('/api/resort-types', resortTypeRoutes);
app.use('/api', uploadRoutes); // ✅ Upload routes (api/upload, api/upload/multiple)
app.use('/api/units', unitRoutes);
// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Multer error handling
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ success: false, message: 'Файлын хэмжээ 5MB-с их байна' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Хамгийн ихдээ 10 файл оруулах боломжтой' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  
  res.status(500).json({ 
    success: false, 
    message: err.message || 'Серверийн алдаа гарлаа' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Сервер ${PORT} порт дээр ажиллаж байна`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`🩺 Health check: http://localhost:${PORT}/health`);
  console.log(`📦 NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`📁 Uploads: ${path.join(__dirname, '../uploads')}`);
});