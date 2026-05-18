const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Зөвхөн JPG, PNG, GIF, WEBP форматын зураг оруулах боломжтой'), false);
  }
};

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Max 10 files
  },
  fileFilter
});

// ==================== SINGLE IMAGE UPLOAD ====================
router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Файл сонгоогүй байна' 
      });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'Зураг амжилттай хуулагдлаа',
      data: { 
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Зураг хуулахад алдаа гарлаа' 
    });
  }
});

// ==================== MULTIPLE IMAGES UPLOAD ====================
router.post('/upload/multiple', authMiddleware, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Файл сонгоогүй байна' 
      });
    }
    
    const images = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
      size: file.size
    }));
    
    res.json({
      success: true,
      message: `${images.length} зураг амжилттай хуулагдлаа`,
      data: { images }
    });
  } catch (error) {
    console.error('Upload multiple error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Зураг хуулахад алдаа гарлаа' 
    });
  }
});

// ==================== DELETE IMAGE ====================
router.delete('/upload/:filename', authMiddleware, (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Буруу файлын нэр' 
      });
    }
    
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: 'Зураг амжилттай устгагдлаа'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Файл олдсонгүй'
      });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Зураг устгахад алдаа гарлаа' 
    });
  }
});

// ==================== GET IMAGE INFO ====================
router.get('/upload/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Буруу файлын нэр' 
      });
    }
    
    const filePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      res.json({
        success: true,
        data: {
          filename,
          size: stats.size,
          created: stats.birthtime,
          url: `/uploads/${filename}`
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Файл олдсонгүй'
      });
    }
  } catch (error) {
    console.error('Get image info error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Мэдээлэл авахад алдаа гарлаа' 
    });
  }
});

// Serve static files
router.use('/uploads', express.static(uploadDir));

module.exports = router;