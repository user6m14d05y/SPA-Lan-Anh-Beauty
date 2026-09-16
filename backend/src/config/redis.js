import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);

let redisClient = null;
let isRedisReady = false;

try {
  redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 5) {
        return null; // Dừng retry nếu quá 5 lần để không gây treo app
      }
      return Math.min(times * 500, 2000);
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    isRedisReady = true;
    console.log(`✅ Kết nối Redis thành công tại ${REDIS_HOST}:${REDIS_PORT}!`);
  });

  redisClient.on('error', (err) => {
    isRedisReady = false;
    // Log thông báo cảnh báo thay vì sập ứng dụng (Graceful Degradation)
    console.warn('⚠️ Cảnh báo Redis:', err.message);
  });
} catch (error) {
  console.warn('⚠️ Không thể khởi tạo Redis Client:', error.message);
}

export const connectRedis = async () => {
  if (!redisClient) return;
  try {
    await redisClient.connect();
  } catch (err) {
    console.warn('⚠️ Chưa thể kết nối Redis trong lần khởi động đầu:', err.message);
  }
};

/**
 * Lấy dữ liệu từ Redis Cache. Nếu lỗi hoặc không có -> trả về null
 */
export const getCache = async (key) => {
  if (!redisClient || !isRedisReady) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn(`[Redis getCache Error] Key: ${key}`, error.message);
    return null;
  }
};

/**
 * Lưu dữ liệu vào Redis Cache với thời gian hết hạn (TTL) tính bằng giây
 */
export const setCache = async (key, value, ttlSeconds = 300) => {
  if (!redisClient || !isRedisReady) return;
  try {
    const serialized = JSON.stringify(value);
    await redisClient.set(key, serialized, 'EX', ttlSeconds);
  } catch (error) {
    console.warn(`[Redis setCache Error] Key: ${key}`, error.message);
  }
};

/**
 * Xóa một hoặc nhiều Key cache khỏi Redis
 */
export const delCache = async (keys) => {
  if (!redisClient || !isRedisReady) return;
  try {
    const keyList = Array.isArray(keys) ? keys : [keys];
    if (keyList.length > 0) {
      await redisClient.del(...keyList);
    }
  } catch (error) {
    console.warn(`[Redis delCache Error]`, error.message);
  }
};

export default redisClient;
