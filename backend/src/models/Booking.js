import { Sequelize } from "sequelize";
import sequelize from "../config/database.js";

const Booking = sequelize.define("Booking", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customerName: {
    type: Sequelize.STRING,
    allowNull: false, // Bắt buộc khách phải nhập tên
  },
  customerPhone: {
    type: Sequelize.STRING,
    allowNull: false, // Bắt buộc khách phải để lại SĐT
  },
  serviceName: {
    type: Sequelize.STRING,
    allowNull: false, // Tên dịch vụ (vd: Massage mặt, Trị mụn...)
  },
  bookingDate: {
    type: Sequelize.DATEONLY, // Chỉ lưu ngày (VD: 2026-05-10)
    allowNull: false,
  },
  bookingTime: {
    type: Sequelize.TIME, // Chỉ lưu giờ (VD: 14:30:00)
    allowNull: false,
  },
  status: {
    type: Sequelize.ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'PENDING', // Mặc định vừa đặt xong là Chờ xác nhận
  }
}, {
  tableName: 'bookings',
  timestamps: true,
});

export default Booking;
