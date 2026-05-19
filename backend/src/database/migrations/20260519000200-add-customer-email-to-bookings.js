export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('bookings', 'customerEmail', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('bookings', 'customerEmail');
  },
};
