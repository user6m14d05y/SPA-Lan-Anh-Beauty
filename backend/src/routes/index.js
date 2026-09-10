import express from 'express';
import userRoutes from './user.Routes.js';
import bookingRoutes from './booking.Routes.js';
import contactRoutes from './contact.Routes.js';
import catalogRoutes from './catalog.Routes.js';
import closedPeriodRoutes from './closedPeriod.Routes.js';
import chatbotRoutes from './chatbot.Routes.js';
import chatRoutes from './chat.Routes.js';
import customerRoutes from './customer.Routes.js';
import dashboardRoutes from './dashboard.Routes.js';
import paymentRoutes from './payment.Routes.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/bookings', bookingRoutes);
router.use('/contacts', contactRoutes);
router.use('/catalog', catalogRoutes);
router.use('/closed-periods', closedPeriodRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/chat', chatRoutes);
router.use('/customers', customerRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/payment', paymentRoutes);
router.use('/sepay-webhook', paymentRoutes);
router.use('/webhook', paymentRoutes);

// Test
router.get('/', (req, res) => {
    res.send('Hello World! API is running');
});

export default router;
