export default {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('bookings', [
      {
        id: 'BK-SAMPLE-001',
        customerName: 'Minh Khach',
        customerPhone: '0900000003',
        customerEmail: 'khach1@gmail.com',
        serviceName: 'Cham soc da co ban',
        bookingDate: '2026-05-10',
        bookingTime: '09:00:00',
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'BK-SAMPLE-002',
        customerName: 'Ngoc Anh',
        customerPhone: '0900000004',
        customerEmail: 'khach2@gmail.com',
        serviceName: 'Tri mun chuyen sau',
        bookingDate: '2026-05-11',
        bookingTime: '14:30:00',
        status: 'CONFIRMED',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'BK-SAMPLE-003',
        customerName: 'Bao Tran',
        customerPhone: '0900000005',
        customerEmail: 'khach3@gmail.com',
        serviceName: 'Massage mat thu gian',
        bookingDate: '2026-05-12',
        bookingTime: '16:00:00',
        status: 'COMPLETED',
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bookings', {
      customerPhone: ['0900000003', '0900000004', '0900000005'],
    });
  },
};
