export default {
  async up(queryInterface, Sequelize) {
    // MySQL yêu cầu định nghĩa lại toàn bộ ENUM khi muốn thay đổi
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('ADMIN', 'STAFF'),
      allowNull: false,
      defaultValue: 'STAFF',
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: khôi phục lại CUSTOMER
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('ADMIN', 'STAFF', 'CUSTOMER'),
      allowNull: false,
      defaultValue: 'CUSTOMER',
    });
  },
};
