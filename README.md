# SPA---Lan-Anh-Beauty
SPA-Lan-Anh-Beauty/
├── backend/                # Node.js (Express, Socket.io, Prisma/Sequelize)
├── client/                 # React.js (Giao diện cho Khách hàng - Client)
├── admin/                  # React.js (Giao diện cho Quản lý / Nhân viên SPA)
├── docker-compose.yml      # Cấu hình Docker (chạy MySQL, Backend, Frontend...)
└── README.md

### Cách chạy dự án khi lấy từ git về
1 - Download .zip
2 - coppy env.example ra thành .env
3 - chỉnh lại database theo database của bạn
4 - C docker:
  docker volume create mysql_data
  docker-compose up --build -d
5 - Vào trang web:
    client: http://localhost:5173
    admin: http://localhost:5174
    backend: http://localhost:5000



