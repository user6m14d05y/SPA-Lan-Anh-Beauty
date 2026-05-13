import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const ServiceCategory = sequelize.define('ServiceCategory', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  parentId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  slug: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  sortOrder: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'service_categories',
  timestamps: true,
});

ServiceCategory.hasMany(ServiceCategory, { as: 'children', foreignKey: 'parentId' });
ServiceCategory.belongsTo(ServiceCategory, { as: 'parent', foreignKey: 'parentId' });

export default ServiceCategory;
