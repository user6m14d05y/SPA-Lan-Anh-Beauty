import express from 'express';
import { bookingController } from '../controllers/bookingController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';
import { uploadImage } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

const handleUploadError = (req, res, next) => {
  uploadImage.single('customerImage')(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Không thể tải ảnh lên.',
      });
    }

    next();
  });
};

router.get('/availability', bookingController.availability);
router.post('/', handleUploadError, bookingController.create);
router.get('/', verifyToken, requireRole('ADMIN', 'STAFF'), bookingController.index);
router.get('/:id', verifyToken, requireRole('ADMIN', 'STAFF'), bookingController.show);
router.put('/:id', verifyToken, requireRole('ADMIN', 'STAFF'), bookingController.update);

export default router;
