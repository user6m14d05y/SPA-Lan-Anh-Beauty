import express from 'express';
import { getContacts } from '../controllers/contactController.js';
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, requireRole('ADMIN', 'STAFF'), getContacts);


export default router;
