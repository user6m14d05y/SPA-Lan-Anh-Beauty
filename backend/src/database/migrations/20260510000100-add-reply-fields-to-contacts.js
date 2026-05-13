export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('contacts', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'NEW',
    });

    await queryInterface.addColumn('contacts', 'replyMessage', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('contacts', 'repliedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('contacts', 'repliedBy', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addIndex('contacts', ['status']);
    await queryInterface.addIndex('contacts', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('contacts', ['createdAt']);
    await queryInterface.removeIndex('contacts', ['status']);
    await queryInterface.removeColumn('contacts', 'repliedBy');
    await queryInterface.removeColumn('contacts', 'repliedAt');
    await queryInterface.removeColumn('contacts', 'replyMessage');
    await queryInterface.removeColumn('contacts', 'status');
  },
};
