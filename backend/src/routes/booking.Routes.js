import express from 'express';
import { bookingController } from '../controllers/bookingController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';
import { uploadImage, validateUploadedFiles } from '../middlewares/uploadMiddleware.js';
import { bookingRateLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

const handleUploadError = (req, res, next) => {
  uploadImage.array('customerImage', 5)(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Không thể tải ảnh lên.',
      });
    }

    try {
      validateUploadedFiles(req, res, (validationError) => {
        if (validationError) {
          return res.status(400).json({
            success: false,
            message: validationError.message || 'Định dạng ảnh không hợp lệ.',
          });
        }
        next();
      });
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message || 'Định dạng ảnh không hợp lệ.',
      });
    }
  });
};

router.get('/availability', bookingController.availability);
router.post('/', bookingRateLimiter, handleUploadError, bookingController.create);
router.get('/', verifyToken, requireRole('ADMIN', 'STAFF'), bookingController.index);
router.get('/:id', verifyToken, requireRole('ADMIN', 'STAFF'), bookingController.show);
router.put('/:id', verifyToken, requireRole('ADMIN', 'STAFF'), bookingController.update);

export default router;
