export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refresh_tokens', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Khoá ngoại trỏ về bảng users
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // Xóa user → tự xóa token của họ
      },
      token: {
        type: Sequelize.TEXT, // TEXT vì token dài
        allowNull: false,
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Index để tìm token nhanh hơn khi verify
    await queryInterface.addIndex('refresh_tokens', ['userId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('refresh_tokens');
  },
};
