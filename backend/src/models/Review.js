import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const Review = sequelize.define('Review', {
  id: {
    type: Sequelize.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  bookingId: {
    type: Sequelize.STRING(20),
    allowNull: false,
    unique: true,
    field: 'booking_id',
  },
  customerPhone: {
    type: Sequelize.STRING,
    allowNull: false,
    field: 'customer_phone',
  },
  serviceName: {
    type: Sequelize.STRING,
    allowNull: false,
    field: 'service_name',
  },
  rating: {
    type: Sequelize.TINYINT.UNSIGNED,
    allowNull: false,
  },
  comment: {
    type: Sequelize.STRING(300),
    allowNull: true,
  },
  displayName: {
    type: Sequelize.STRING(100),
    allowNull: false,
    field: 'display_name',
  },
  avatarType: {
    type: Sequelize.ENUM('initials', 'upload'),
    defaultValue: 'initials',
    field: 'avatar_type',
  },
  avatarValue: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'avatar_value',
  },
  status: {
    type: Sequelize.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  rejectionReason: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'rejection_reason',
  },
  approvedBy: {
    type: Sequelize.BIGINT.UNSIGNED,
    allowNull: true,
    field: 'approved_by',
  },
  approvedAt: {
    type: Sequelize.DATE,
    allowNull: true,
    field: 'approved_at',
  },
}, {
  tableName: 'reviews',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Review;
