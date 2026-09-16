import express from 'express';
import { paymentController } from '../controllers/paymentController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// SePay IPN Webhook Endpoint (supports POST, GET, all paths /sepay-webhook, /webhook, /sepay, /)
router.all('/sepay-webhook', paymentController.handleSepayWebhook);
router.all('/webhook', paymentController.handleSepayWebhook);
router.all('/sepay', paymentController.handleSepayWebhook);
router.all('/', paymentController.handleSepayWebhook);

// Check payment status endpoint for frontend polling
router.get('/check-status', paymentController.checkPaymentStatus);

// Simulate payment success (manual confirm or test trigger)
router.post('/simulate-success', verifyToken, requireRole('ADMIN'), paymentController.simulateSuccess);

export default router;
