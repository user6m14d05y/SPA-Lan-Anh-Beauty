import express from 'express';
import {
  createService,
  getCategories,
  getCategoryTree,
  getServiceDetail,
  getServices,
  toggleServiceActive,
  updateService,
} from '../controllers/catalogController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();
const adminOnly = [verifyToken, requireRole('ADMIN')];

router.get('/categories', getCategories);
router.get('/tree', getCategoryTree);
router.get('/services', getServices);
router.post('/services', adminOnly, createService);
router.put('/services/:id', adminOnly, updateService);
router.patch('/services/:id/toggle-active', adminOnly, toggleServiceActive);
router.get('/services/:slug', getServiceDetail);

export default router;
