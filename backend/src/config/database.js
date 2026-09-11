import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Các thông số này khớp với file docker-compose.yml của bạn
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST, // 'mysql' trong Docker network nội bộ
    port: Number(process.env.DB_PORT || 3306), // 3306 là port nội bộ Docker, 3307 là port expose ra ngoài
    dialect: 'mysql',
    logging: false,
  }
);

export const connectDB = async (retries = 10, delay = 3000) => {
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('✅ Kết nối Database MySQL thành công!');
      return;
    } catch (error) {
      console.error(`⚠️ Chưa thể kết nối tới Database MySQL (${retries} lần thử còn lại):`, error.message);
      retries -= 1;
      if (retries === 0) {
        console.error('❌ Thất bại kết nối Database MySQL sau nhiều lần thử:', error);
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

export default sequelize;
