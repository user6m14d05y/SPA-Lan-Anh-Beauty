import express from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/stats', verifyToken, requireRole('ADMIN', 'STAFF'), dashboardController.stats);

export default router;
