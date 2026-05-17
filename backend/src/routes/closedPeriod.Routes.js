import express from 'express';
import { closedPeriodController } from '../controllers/closedPeriodController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, requireRole('ADMIN', 'STAFF'), closedPeriodController.index);
router.post('/', verifyToken, requireRole('ADMIN', 'STAFF'), closedPeriodController.create);
router.delete('/:id', verifyToken, requireRole('ADMIN', 'STAFF'), closedPeriodController.delete);

export default router;
