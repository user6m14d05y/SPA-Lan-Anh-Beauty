import express from 'express';
import {
  getConversationMessages,
  listConversations,
  startConversation,
} from '../controllers/chatController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();
const adminOrStaff = [verifyToken, requireRole('ADMIN', 'STAFF')];

router.post('/conversations', startConversation);
router.get('/conversations', adminOrStaff, listConversations);
router.get('/conversations/:id/messages', adminOrStaff, getConversationMessages);

export default router;
