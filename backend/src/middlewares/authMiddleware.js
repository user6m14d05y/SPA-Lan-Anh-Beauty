import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware xác thực JWT token từ header Authorization
 * Header format: Authorization: Bearer <token>
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Lấy phần sau "Bearer "

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Không có token xác thực. Vui lòng đăng nhập.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Gắn thông tin user vào request
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(403).json({
      success: false,
      message: 'Token không hợp lệ.',
      code: 'TOKEN_INVALID',
    });
  }
};

/**
 * Middleware kiểm tra role của user
 * Dùng sau verifyToken
 * @param {...string} roles - Danh sách role được phép truy cập
 * @example requireRole('ADMIN', 'STAFF')
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền truy cập. Yêu cầu role: ${roles.join(', ')}.`,
        code: 'FORBIDDEN',
      });
    }

    next();
  };
};
