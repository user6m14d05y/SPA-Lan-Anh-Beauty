export default {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('bookings');
    if (!tableInfo.notes) {
      await queryInterface.addColumn('bookings', 'notes', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!tableInfo.customerImage) {
      await queryInterface.addColumn('bookings', 'customerImage', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    try { await queryInterface.addIndex('bookings', ['bookingDate']); } catch (e) {}
    try { await queryInterface.addIndex('bookings', ['bookingDate', 'bookingTime']); } catch (e) {}
    try { await queryInterface.addIndex('bookings', ['status']); } catch (e) {}
  },

  async down(queryInterface) {
    try { await queryInterface.removeIndex('bookings', ['status']); } catch (e) {}
    try { await queryInterface.removeIndex('bookings', ['bookingDate', 'bookingTime']); } catch (e) {}
    try { await queryInterface.removeIndex('bookings', ['bookingDate']); } catch (e) {}
    const tableInfo = await queryInterface.describeTable('bookings');
    if (tableInfo.customerImage) await queryInterface.removeColumn('bookings', 'customerImage');
    if (tableInfo.notes) await queryInterface.removeColumn('bookings', 'notes');
  },
};
