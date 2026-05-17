import express from 'express';
import userRoutes from './user.Routes.js';
import bookingRoutes from './booking.Routes.js';
import contactRoutes from './contact.Routes.js';
import catalogRoutes from './catalog.Routes.js';
import closedPeriodRoutes from './closedPeriod.Routes.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/bookings', bookingRoutes);
router.use('/contacts', contactRoutes);
router.use('/catalog', catalogRoutes);
router.use('/closed-periods', closedPeriodRoutes);

// Test
router.get('/', (req, res) => {
    res.send('Hello World! API is running');
});

export default router;