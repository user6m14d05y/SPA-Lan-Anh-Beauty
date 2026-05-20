import express from 'express';
import { customerController } from '../controllers/customerController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, requireRole('ADMIN', 'STAFF'), customerController.index);

export default router;
