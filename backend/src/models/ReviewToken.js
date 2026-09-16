import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const ReviewToken = sequelize.define('ReviewToken', {
  id: {
    type: Sequelize.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  bookingId: {
    type: Sequelize.STRING(20),
    allowNull: false,
    field: 'booking_id',
  },
  customerName: {
    type: Sequelize.STRING,
    allowNull: false,
    field: 'customer_name',
  },
  customerPhone: {
    type: Sequelize.STRING,
    allowNull: false,
    field: 'customer_phone',
  },
  customerEmail: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'customer_email',
  },
  tokenHash: {
    type: Sequelize.CHAR(64),
    allowNull: false,
    unique: true,
    field: 'token_hash',
  },
  expiresAt: {
    type: Sequelize.DATE,
    allowNull: false,
    field: 'expires_at',
  },
  usedAt: {
    type: Sequelize.DATE,
    allowNull: true,
    field: 'used_at',
  },
  sendStatus: {
    type: Sequelize.ENUM('pending', 'sent', 'delivered', 'failed', 'no_contact', 'manual_sent'),
    defaultValue: 'pending',
    field: 'send_status',
  },
  sendAttempts: {
    type: Sequelize.TINYINT.UNSIGNED,
    defaultValue: 0,
    field: 'send_attempts',
  },
  failedReason: {
    type: Sequelize.STRING,
    allowNull: true,
    field: 'failed_reason',
  },
}, {
  tableName: 'review_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default ReviewToken;
