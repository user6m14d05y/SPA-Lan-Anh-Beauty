import { makeContact } from '../factories/contactFactory.js';

export default {
  async up(queryInterface) {
    await queryInterface.bulkInsert('contacts', [
      makeContact({
        name: 'Lan Anh',
        email: 'lananh@example.com',
      }),
      makeContact({
        name: 'Minh Thu',
        email: 'minhthu@example.com',
        message: 'Toi muon dat lich cham soc da.',
      }),
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('contacts', {
      email: ['lananh@example.com', 'minhthu@example.com'],
    });
  },
};
