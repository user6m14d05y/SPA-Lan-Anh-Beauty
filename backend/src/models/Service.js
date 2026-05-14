import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';
import ServiceCategory from './ServiceCategory.js';

const Service = sequelize.define('Service', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  categoryId: {
    type: Sequelize.INTEGER,
    allowNull: false,
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
  shortDescription: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  description: {
    type: Sequelize.TEXT('long'),
    allowNull: true,
  },
  price: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  priceLabel: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  durationMinutes: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  imageUrl: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  images: {
    type: Sequelize.TEXT('long'),
    allowNull: true,
  },
  discountPercent: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isFeatured: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  sortOrder: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'services',
  timestamps: true,
});

Service.belongsTo(ServiceCategory, { as: 'category', foreignKey: 'categoryId' });
ServiceCategory.hasMany(Service, { as: 'services', foreignKey: 'categoryId' });

export default Service;
