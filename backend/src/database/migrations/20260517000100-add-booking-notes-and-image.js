export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('bookings', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('bookings', 'customerImage', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addIndex('bookings', ['bookingDate']);
    await queryInterface.addIndex('bookings', ['bookingDate', 'bookingTime']);
    await queryInterface.addIndex('bookings', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('bookings', ['status']);
    await queryInterface.removeIndex('bookings', ['bookingDate', 'bookingTime']);
    await queryInterface.removeIndex('bookings', ['bookingDate']);
    await queryInterface.removeColumn('bookings', 'customerImage');
    await queryInterface.removeColumn('bookings', 'notes');
  },
};
