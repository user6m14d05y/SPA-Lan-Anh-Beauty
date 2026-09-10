import express from 'express';
import { paymentController } from '../controllers/paymentController.js';

const router = express.Router();

// SePay IPN Webhook POST Endpoint
router.post('/sepay-webhook', paymentController.handleSepayWebhook);

// Check payment status endpoint for frontend polling
router.get('/check-status', paymentController.checkPaymentStatus);

// Simulate payment success (manual confirm or test trigger)
router.post('/simulate-success', paymentController.simulateSuccess);

export default router;
