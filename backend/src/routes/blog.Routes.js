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
import { uploadImage, validateUploadedFiles } from '../middlewares/uploadMiddleware.js';

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
router.post('/admin/upload-image', adminOnly, (req, res, next) => {
  uploadImage.single('image')(req, res, (error) => {
    if (error) return res.status(400).json({ success: false, message: error.message || 'Không thể tải ảnh lên.' });
    validateUploadedFiles(req, res, (validationError) => {
      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError.message || 'Định dạng ảnh không hợp lệ.',
        });
      }
      next();
    });
  });
}, uploadBlogImage);
router.put('/admin/posts/:id', adminOnly, updatePost);
router.patch('/admin/posts/:id/status', adminOnly, updatePostStatus);
router.delete('/admin/posts/:id', adminOnly, deletePost);

export default router;

