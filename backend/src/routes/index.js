import express from 'express';
import userRoutes from './userRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import contactRoutes from './contactRoutes.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/bookings', bookingRoutes);
router.use('/contacts', contactRoutes);

// Test
router.get('/', (req, res) => {
    res.send('Hello World! API is running');
});

export default router;