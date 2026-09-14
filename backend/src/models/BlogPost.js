import { Sequelize } from 'sequelize';
import sequelize from '../config/database.js';
import BlogCategory from './BlogCategory.js';
import User from './User.js';

const BlogPost = sequelize.define('BlogPost', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  categoryId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  authorId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  authorName: {
    type: Sequelize.STRING(150),
    allowNull: false,
    defaultValue: 'Lan Anh Beauty',
  },
  title: {
    type: Sequelize.STRING(255),
    allowNull: false,
  },
  slug: {
    type: Sequelize.STRING(280),
    allowNull: false,
    unique: true,
  },
  excerpt: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  content: {
    type: Sequelize.TEXT('long'),
    allowNull: false,
  },
  imageUrl: {
    type: Sequelize.STRING(500),
    allowNull: true,
  },
  status: {
    type: Sequelize.ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED'),
    allowNull: false,
    defaultValue: 'DRAFT',
  },
  publishedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  isFeatured: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  readingTimeMinutes: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  viewCount: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  sortOrder: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'blog_posts',
  timestamps: true,
});

BlogPost.belongsTo(BlogCategory, { as: 'category', foreignKey: 'categoryId' });
BlogCategory.hasMany(BlogPost, { as: 'posts', foreignKey: 'categoryId' });
BlogPost.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
User.hasMany(BlogPost, { as: 'blogPosts', foreignKey: 'authorId' });

export default BlogPost;
