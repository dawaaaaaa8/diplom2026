const multer = require('multer');
const path = require('path');

// Зургийн файлын төрөл шалгах
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Зөвхөн зургийн файл оруулна уу'));
  }
};

// Memory storage ашиглах
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
});

// Олон зураг upload хийх
const uploadMultiple = upload.array('images', 10);

// Нэг зураг upload хийх
const uploadSingle = upload.single('image');

module.exports = { uploadMultiple, uploadSingle };