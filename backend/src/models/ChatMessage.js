import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  conversationId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  senderType: {
    type: Sequelize.ENUM('CUSTOMER', 'STAFF', 'SYSTEM'),
    allowNull: false,
  },
  senderName: {
    type: Sequelize.STRING(150),
    allowNull: false,
  },
  senderUserId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  message: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'chat_messages',
  timestamps: true,
});

export default ChatMessage;
