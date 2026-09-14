export default {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('bookings');
    if (!tableInfo.customerEmail) {
      await queryInterface.addColumn('bookings', 'customerEmail', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('bookings');
    if (tableInfo.customerEmail) {
      await queryInterface.removeColumn('bookings', 'customerEmail');
    }
  },
};
