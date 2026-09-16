import express from 'express';
import { reviewController } from '../controllers/reviewController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();
const adminOrStaff = [verifyToken, requireRole('ADMIN', 'STAFF')];

// === PUBLIC CLIENT ROUTES ===
router.get('/public', reviewController.getPublicApprovedReviews);
router.get('/verify-token', reviewController.verifyToken);
router.post('/submit', reviewController.submitReview);

// === ADMIN / STAFF PROTECTED ROUTES ===
router.get('/admin/tokens', adminOrStaff, reviewController.getAdminTokens);
router.post('/admin/tokens/:id/log-action', adminOrStaff, reviewController.logStaffAction);
router.get('/admin/reviews', adminOrStaff, reviewController.getAdminReviews);
router.patch('/admin/reviews/:id/status', adminOrStaff, reviewController.updateReviewStatus);

export default router;
