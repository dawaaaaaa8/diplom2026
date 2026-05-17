const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Хэрэглэгч олдсонгүй'
      });
    }

    if (!allowedRoles.includes(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        message: 'Танд энэ үйлдлийг хийх эрх байхгүй'
      });
    }

    next();
  };
};

module.exports = roleCheck;