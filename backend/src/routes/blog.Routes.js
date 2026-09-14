import express from 'express';
import {
  createCategory,
  createPost,
  deletePost,
  getAdminPost,
  getAdminPosts,
  getAdminCategories,
  deleteCategory,
  getCategories,
  getPost,
  getPosts,
  incrementView,
  updateCategory,
  updatePost,
  updatePostStatus,
  uploadBlogImage,
} from '../controllers/blogController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';
import { blogViewRateLimiter } from '../middlewares/rateLimitMiddleware.js';
import { uploadImage } from '../middlewares/uploadMiddleware.js';

const router = express.Router();
const adminOnly = [verifyToken, requireRole('ADMIN')];

router.get('/categories', getCategories);
router.get('/posts', getPosts);
router.get('/posts/:slug', getPost);
router.post('/posts/:slug/view', blogViewRateLimiter, incrementView);

router.get('/admin/categories', adminOnly, getAdminCategories);
router.post('/admin/categories', adminOnly, createCategory);
router.put('/admin/categories/:id', adminOnly, updateCategory);
router.delete('/admin/categories/:id', adminOnly, deleteCategory);
router.get('/admin/posts', adminOnly, getAdminPosts);
router.get('/admin/posts/:id', adminOnly, getAdminPost);
router.post('/admin/posts', adminOnly, createPost);
router.post('/admin/upload-image', adminOnly, uploadImage.single('image'), uploadBlogImage);
router.put('/admin/posts/:id', adminOnly, updatePost);
router.patch('/admin/posts/:id/status', adminOnly, updatePostStatus);
router.delete('/admin/posts/:id', adminOnly, deletePost);

export default router;

