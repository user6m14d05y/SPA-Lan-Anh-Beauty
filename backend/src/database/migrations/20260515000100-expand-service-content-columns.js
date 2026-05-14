// Đổi Dữ liệu Service

export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('services', 'description', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    });

    await queryInterface.changeColumn('services', 'images', {
      type: Sequelize.TEXT('long'),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('services', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.changeColumn('services', 'images', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
};
