export default {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        fullName: 'Lan Anh Admin',
        email: 'admin@lananhbeauty.local',
        password: '123456',
        phone: '0900000001',
        role: 'ADMIN',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        fullName: 'Thu Ngan Staff',
        email: 'staff@lananhbeauty.local',
        password: '123456',
        phone: '0900000002',
        role: 'STAFF',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        fullName: 'Minh Khach',
        email: 'customer@lananhbeauty.local',
        password: '123456',
        phone: '0900000003',
        role: 'CUSTOMER',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', {
      email: [
        'admin@lananhbeauty.local',
        'staff@lananhbeauty.local',
        'customer@lananhbeauty.local',
      ],
    });
  },
};
