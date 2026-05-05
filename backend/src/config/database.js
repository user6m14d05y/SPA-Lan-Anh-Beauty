import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Các thông số này khớp với file docker-compose.yml của bạn
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST, // Sẽ là 'localhost' nếu chạy node ngoài Docker, hoặc 'mysql' nếu chạy trong Docker mạng nội bộ
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false, // Tắt log các câu query để console gọn gàng hơn
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(' Kết nối Database MySQL thành công!');
  } catch (error) {
    console.error(' Không thể kết nối tới Database:', error);
    process.exit(1);
  }
};

export default sequelize;
