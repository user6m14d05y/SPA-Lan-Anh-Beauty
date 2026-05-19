export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_conversations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      visitorId: {
        type: Sequelize.STRING(80),
        allowNull: false,
        unique: true,
      },
      customerName: {
        type: Sequelize.STRING(150),
        allowNull: false,
        defaultValue: 'Khách hàng',
      },
      customerPhone: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
      customerEmail: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('OPEN', 'CLOSED'),
        allowNull: false,
        defaultValue: 'OPEN',
      },
      assignedTo: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      lastMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lastMessageAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      unreadByStaff: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      unreadByCustomer: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addIndex('chat_conversations', ['visitorId']);
    await queryInterface.addIndex('chat_conversations', ['status']);
    await queryInterface.addIndex('chat_conversations', ['lastMessageAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('chat_conversations');
  },
};
