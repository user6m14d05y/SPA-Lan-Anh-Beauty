import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CAPTCHA_SECRET = process.env.JWT_SECRET || 'captcha-hmac-secret';
const CAPTCHA_TTL_MS = 5 * 60 * 1000; // Token hết hạn sau 5 phút

/**
 * Tạo HMAC token từ text + timestamp.
 * Format token: "<timestamp>.<hmac>"
 */
export const signCaptchaToken = (text) => {
  const ts = Date.now().toString();
  const hmac = crypto
    .createHmac('sha256', CAPTCHA_SECRET)
    .update(`${text.toLowerCase()}:${ts}`)
    .digest('hex');
  return `${ts}.${hmac}`;
};

/**
 * Xác minh token và text người dùng nhập.
 * Trả về true nếu hợp lệ, false nếu sai / hết hạn.
 */
export const verifyCaptchaToken = (token, inputText) => {
  if (!token || !inputText) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [ts, hmac] = parts;
  const timestamp = parseInt(ts, 10);
  if (isNaN(timestamp)) return false;

  // Kiểm tra hết hạn
  if (Date.now() - timestamp > CAPTCHA_TTL_MS) return false;

  // Tính lại HMAC và so sánh để chống giả mạo
  const expectedHmac = crypto
    .createHmac('sha256', CAPTCHA_SECRET)
    .update(`${inputText.trim().toLowerCase()}:${ts}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(expectedHmac, 'hex')
  );
};

// ─── Middleware 1: Kiểm tra captcha (không dùng session) ──────────────────────
export const validateCaptchaMiddleware = (req, res, next) => {
  const captchaCode = req.body?.captchaCode?.trim();
  const captchaToken = req.body?.captchaToken;

  // Không gửi captcha -> bỏ qua, để rate limiter quyết định
  if (!captchaCode && !captchaToken) {
    req.captchaValidated = false;
    return next();
  }

  // Có gửi nhưng thiếu token hoặc code -> lỗi
  if (!captchaCode || !captchaToken) {
    return res.status(400).json({
      success: false,
      message: 'Thông tin CAPTCHA không hợp lệ. Vui lòng tải lại mã mới.',
      requireCaptcha: true,
    });
  }

  if (!verifyCaptchaToken(captchaToken, captchaCode)) {
    return res.status(400).json({
      success: false,
      message: 'Mã CAPTCHA không chính xác hoặc đã hết hạn. Vui lòng thử lại.',
      requireCaptcha: true,
    });
  }

  // CAPTCHA hợp lệ -> đánh dấu để rate limiter bỏ qua
  req.captchaValidated = true;
  next();
};

// ─── Middleware 2: Rate Limiter (đếm theo IP) ──────────────────────────────
export const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 3,                    // Tối đa 3 lần; lần thứ 4 bị chặn
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.captchaValidated === true,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Bạn đã gửi liên hệ quá nhiều lần. Vui lòng xác thực mã bên dưới để tiếp tục.',
      requireCaptcha: true,
    });
  },
});
