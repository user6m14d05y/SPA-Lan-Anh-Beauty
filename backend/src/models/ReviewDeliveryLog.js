import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const ReviewDeliveryLog = sequelize.define('ReviewDeliveryLog', {
  id: {
    type: Sequelize.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  reviewTokenId: {
    type: Sequelize.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'review_token_id',
  },
  staffId: {
    type: Sequelize.BIGINT.UNSIGNED,
    allowNull: false,
    field: 'staff_id',
  },
  action: {
    type: Sequelize.ENUM('copied_link', 'generated_qr', 'marked_sent'),
    allowNull: false,
  },
}, {
  tableName: 'review_delivery_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default ReviewDeliveryLog;
