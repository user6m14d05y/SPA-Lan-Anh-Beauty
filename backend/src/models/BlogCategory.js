import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';

const BlogCategory = sequelize.define('BlogCategory', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING(150),
    allowNull: false,
  },
  slug: {
    type: Sequelize.STRING(180),
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
  tableName: 'blog_categories',
  timestamps: true,
});

export default BlogCategory;
