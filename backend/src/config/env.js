import path from 'path';
import dotenv from 'dotenv';

// Load the project and backend env files before any security-sensitive module reads them.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env'), override: false });

const isPlaceholder = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || normalized.includes('your_') || normalized.includes('change_me') || normalized.includes('replace_');
};

const requiredSecret = (name, { minLength = 32 } = {}) => {
  const value = String(process.env[name] || '').trim();
  if (isPlaceholder(value) || value.length < minLength) {
    throw new Error(`Thiếu hoặc không an toàn biến môi trường bắt buộc: ${name}.`);
  }
  return value;
};

export const JWT_SECRET = requiredSecret('JWT_SECRET');
export const SEPAY_API_KEY = requiredSecret('SEPAY_API_KEY', { minLength: 16 });
export const SEPAY_SECRET_KEY = requiredSecret('SEPAY_SECRET_KEY', { minLength: 16 });
export const CAPTCHA_SECRET = requiredSecret('CAPTCHA_SECRET');

const configuredOrigins = String(process.env.CORS_ORIGINS || process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (configuredOrigins.length === 0 || configuredOrigins.some((origin) => origin === '*' || !/^https?:\/\/[^\s/]+(?::\d+)?$/.test(origin))) {
  throw new Error('CORS_ORIGINS phải chứa ít nhất một Origin http(s) hợp lệ và không được là wildcard.');
}

export const CORS_ORIGINS = Object.freeze([...new Set(configuredOrigins)]);
export const PORT = Number(process.env.PORT || 5000);
