import express from 'express';
import { bookingController } from '../controllers/bookingController.js';

const router = express.Router();

router.post('/', bookingController.create);
router.get('/', bookingController.index);
router.get('/:id', bookingController.show);
router.put('/:id', bookingController.update);
router.delete('/:id', bookingController.delete);

export default router;