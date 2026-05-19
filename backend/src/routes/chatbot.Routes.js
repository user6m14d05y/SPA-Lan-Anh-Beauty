import express from 'express';
import { sendChatbotMessage } from '../controllers/chatbotController.js';
import { chatbotRateLimiter } from '../middlewares/rateLimitMiddleware.js';

const router = express.Router();

router.post('/message', chatbotRateLimiter, sendChatbotMessage);

export default router;
