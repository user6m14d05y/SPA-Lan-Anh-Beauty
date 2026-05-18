export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_messages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      conversationId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'chat_conversations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      senderType: {
        type: Sequelize.ENUM('CUSTOMER', 'STAFF', 'SYSTEM'),
        allowNull: false,
      },
      senderName: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      senderUserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      message: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('chat_messages', ['conversationId']);
    await queryInterface.addIndex('chat_messages', ['senderType']);
    await queryInterface.addIndex('chat_messages', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('chat_messages');
  },
};
