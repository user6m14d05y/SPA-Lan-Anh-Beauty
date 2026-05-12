import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const Contact = sequelize.define('Contact', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  message: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  // Updated
  status: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: 'NEW',
  },
  replyMessage: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  repliedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  repliedBy: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'contacts',
  timestamps: true,
});

export default Contact;
