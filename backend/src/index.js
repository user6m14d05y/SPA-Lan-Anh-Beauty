import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/database.js';
import router from './routes/index.js';

// Load biến môi trường từ file .env
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Middlewares
app.use(cors());
app.use(express.json()); // Để parse body dạng JSON
app.use(express.urlencoded({ extended: true }));

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

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  httpServer.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
  });
};

startServer();
