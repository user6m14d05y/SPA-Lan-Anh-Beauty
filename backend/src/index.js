import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/database.js';
import router from './routes/index.js';
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
  origin: true, // Cho phép mọi origin gọi và nhận credential (hoặc chỉ định http://localhost:5173)
  credentials: true
}));
app.use(express.json({ limit: '25mb' })); // Để parse body dạng JSON
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/uploads/img', express.static(path.join(process.cwd(), 'uploads', 'img')));

app.use('/api', router);

// Cấu hình Socket.io cho realtime (thông báo lịch hẹn, chat...)
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Trong thực tế nên giới hạn domain của client/admin
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
