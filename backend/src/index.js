import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { CORS_ORIGINS, PORT } from './config/env.js';
import { connectDB } from './config/database.js';
import { connectRedis } from './config/redis.js';
import router from './routes/index.js';
import paymentRoutes from './routes/payment.Routes.js';
import { setupChatSocket } from './socket/chatSocket.js';
import { startScheduler } from './services/schedulerService.js';

const isAllowedOrigin = (origin) => !origin || CORS_ORIGINS.includes(origin);
const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Origin không được phép.'));
  },
  credentials: true,
};

const app = express();
const httpServer = createServer(app);

app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));

const uploadsImgDir = path.join(process.cwd(), 'uploads', 'img');
if (!fs.existsSync(uploadsImgDir)) fs.mkdirSync(uploadsImgDir, { recursive: true });
app.use('/uploads/img', express.static(uploadsImgDir));

app.use((req, res, next) => {
  if (req.url.includes('webhook') || req.url.includes('sepay') || req.url.includes('payment')) {
    console.log(`[Webhook Request] ${req.method} ${req.url}`);
  }
  next();
});

app.use('/sepay-webhook', paymentRoutes);
app.use('/webhook', paymentRoutes);
app.use('/sepay', paymentRoutes);
app.use('/api/sepay-webhook', paymentRoutes);
app.use('/api/webhook', paymentRoutes);
app.post('/', paymentRoutes);
app.use('/api', router);

app.use((err, req, res, next) => {
  console.error('[Backend Global Error]', err.stack || err.message || err);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({ success: false, message: err.message || 'Lỗi xử lý hệ thống.' });
});

const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGINS, credentials: true, methods: ['GET', 'POST'] },
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Backend is running correctly!' });
});

setupChatSocket(io);

const startServer = async () => {
  await connectDB();
  await connectRedis();
  startScheduler();
  httpServer.listen(PORT, () => console.log(`Server đang chạy tại http://localhost:${PORT}`));
};

startServer();
