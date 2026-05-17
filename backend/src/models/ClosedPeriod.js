import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const ClosedPeriod = sequelize.define('ClosedPeriod', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  shift: {
    type: Sequelize.ENUM('MORNING', 'AFTERNOON', 'FULL_DAY'),
    allowNull: false,
  },
  reason: {
    type: Sequelize.STRING,
    allowNull: true,
  },
}, {
  tableName: 'closed_periods',
  timestamps: true,
});

export default ClosedPeriod;
