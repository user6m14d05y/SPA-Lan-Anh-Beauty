export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('closed_periods', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      shift: {
        type: Sequelize.ENUM('MORNING', 'AFTERNOON', 'FULL_DAY'),
        allowNull: false,
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('closed_periods', ['date']);
    await queryInterface.addIndex('closed_periods', ['date', 'shift'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('closed_periods');
  },
};
