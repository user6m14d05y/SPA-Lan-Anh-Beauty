import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/database.js';
import router from './routes/index.js';
import paymentRoutes from './routes/payment.Routes.js';
import { setupChatSocket } from './socket/chatSocket.js';
import { startScheduler } from './services/schedulerService.js';

// Load biến môi trường từ file .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env'), override: false });
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env'), override: false });

const app = express();
const httpServer = createServer(app);

// Middlewares
app.use(cors({
  origin: true, // Cho phép mọi origin gọi và nhận credential
  credentials: true
}));
app.use(express.json({ limit: '25mb' })); // Để parse body dạng JSON
import fs from 'fs';

// Tự động khởi tạo thư mục uploads/img nếu chưa có
const uploadsImgDir = path.join(process.cwd(), 'uploads', 'img');
if (!fs.existsSync(uploadsImgDir)) {
  fs.mkdirSync(uploadsImgDir, { recursive: true });
}

app.use('/uploads/img', express.static(uploadsImgDir));

// Request logger for incoming Webhook / API debugging
app.use((req, res, next) => {
  if (req.url.includes('webhook') || req.url.includes('sepay') || req.url.includes('payment')) {
    console.log(`[Webhook Request] ${req.method} ${req.url} - Body:`, JSON.stringify(req.body || {}));
  }
  next();
});

// Root-level & Alias mounts for SePay Webhooks (prevents 404 regardless of URL configured in SePay)
app.use('/sepay-webhook', paymentRoutes);
app.use('/webhook', paymentRoutes);
app.use('/sepay', paymentRoutes);
app.use('/api/sepay-webhook', paymentRoutes);
app.use('/api/webhook', paymentRoutes);
app.post('/', paymentRoutes);

// API routes
app.use('/api', router);

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('[Backend Global Error]', err.stack || err.message || err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Lỗi xử lý hệ thống.',
  });
});

// Cấu hình Socket.io cho realtime
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Route test cơ bản
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Backend is running correctly!' });
});

setupChatSocket(io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  startScheduler();

  httpServer.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
  });
};

startServer();
