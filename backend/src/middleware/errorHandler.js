const errorHandler = (err, req, res, next) => {
  console.error('🔥 Error:', err);

  let statusCode = 500;
  let message = 'Серверийн алдаа гарлаа';

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Хүчингүй токен';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Токен хугацаа дууссан';
  }

  if (err.code === '23505') {
    statusCode = 400;
    message = 'Имэйл хаяг аль хэдийн бүртгэгдсэн байна';
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = errorHandler;