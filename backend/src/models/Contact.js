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
}, {
  tableName: 'contacts',
  timestamps: true,
});

export default Contact;
