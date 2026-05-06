import express from 'express';
import userRoutes from './userRoutes.js';
import bookingRoutes from './bookingRoutes.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/bookings', bookingRoutes);

// Test
router.get('/', (req, res) => {
    res.send('Hello World! API is running');
});

export default router;