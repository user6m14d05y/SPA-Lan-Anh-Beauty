import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const ChatConversation = sequelize.define('ChatConversation', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  visitorId: {
    type: Sequelize.STRING(80),
    allowNull: false,
    unique: true,
  },
  customerName: {
    type: Sequelize.STRING(150),
    allowNull: false,
    defaultValue: 'Khách hàng',
  },
  customerPhone: {
    type: Sequelize.STRING(30),
    allowNull: true,
  },
  customerEmail: {
    type: Sequelize.STRING(150),
    allowNull: true,
  },
  status: {
    type: Sequelize.ENUM('OPEN', 'CLOSED'),
    allowNull: false,
    defaultValue: 'OPEN',
  },
  assignedTo: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  lastMessage: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  lastMessageAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  unreadByStaff: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  unreadByCustomer: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'chat_conversations',
  timestamps: true,
});

export default ChatConversation;
