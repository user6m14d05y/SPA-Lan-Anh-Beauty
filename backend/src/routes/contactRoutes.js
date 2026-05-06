import express from 'express';
import { getContacts } from '../controllers/contactController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, getContacts);


export default router;
