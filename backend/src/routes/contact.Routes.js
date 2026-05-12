import express from 'express';
import {
  createContact,
  deleteContact,
  getContactDetail,
  getContacts,
  replyContact,
  generateCaptcha
} from '../controllers/contactController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';
import { contactRateLimiter, validateCaptchaMiddleware } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();
const adminOrStaff = [verifyToken, requireRole('ADMIN', 'STAFF')];

router.get('/captcha', generateCaptcha);
router.post('/', validateCaptchaMiddleware, contactRateLimiter, createContact);
router.get('/', adminOrStaff, getContacts);
router.get('/:id', adminOrStaff, getContactDetail);
router.post('/:id/reply', adminOrStaff, replyContact);
router.delete('/:id', adminOrStaff, deleteContact);

export default router;
