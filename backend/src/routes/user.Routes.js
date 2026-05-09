import express from 'express';
import { userController } from '../controllers/userController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// === PUBLIC ROUTES (không cần token) ===
router.post('/login', userController.login);

// === PROTECTED ROUTES (cần đăng nhập) ===
router.post('/logout', verifyToken, userController.logout);
router.get('/me', verifyToken, userController.me); // Lấy thông tin user hiện tại

// === ADMIN ONLY ROUTES ===

// Create user
router.post('/', verifyToken, requireRole('ADMIN'), userController.create);

router.get('/', verifyToken, requireRole('ADMIN'), userController.index);
router.get('/:id', verifyToken, requireRole('ADMIN', 'STAFF'), userController.show);
router.put('/:id', verifyToken, requireRole('ADMIN'), userController.update);


export default router;