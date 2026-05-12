export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('services', 'images', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('services', 'discountPercent', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('services', 'discountPercent');
    await queryInterface.removeColumn('services', 'images');
  },
};
