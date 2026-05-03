import express from 'express';
import { userController } from '../controllers/userController.js';

const router = express.Router();

router.post('/login', userController.login);
router.post('/register', userController.register);
router.post('/logout', userController.logout);
router.get('/', userController.index);
router.get('/:id', userController.show);
router.put('/:id', userController.update);

export default router;