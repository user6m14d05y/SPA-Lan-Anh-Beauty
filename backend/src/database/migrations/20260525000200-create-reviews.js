export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('reviews', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    booking_id: {
      type: Sequelize.STRING(20),
      allowNull: false,
      unique: true,
      references: {
        model: 'bookings',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    customer_phone: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    service_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    rating: {
      type: Sequelize.TINYINT.UNSIGNED,
      allowNull: false,
    },
    comment: {
      type: Sequelize.STRING(300),
      allowNull: true,
    },
    display_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    avatar_type: {
      type: Sequelize.ENUM('initials', 'upload'),
      allowNull: false,
      defaultValue: 'initials',
    },
    avatar_value: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    rejection_reason: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    approved_by: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: true,
    },
    approved_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
    },
  });

  await queryInterface.addIndex('reviews', ['status']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('reviews');
}
