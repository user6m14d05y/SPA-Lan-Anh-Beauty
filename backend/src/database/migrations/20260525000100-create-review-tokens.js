export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('review_tokens', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    booking_id: {
      type: Sequelize.STRING(20),
      allowNull: false,
      references: {
        model: 'bookings',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    customer_name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    customer_phone: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    customer_email: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    token_hash: {
      type: Sequelize.CHAR(64),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    used_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    send_status: {
      type: Sequelize.ENUM('pending', 'sent', 'delivered', 'failed', 'no_contact', 'manual_sent'),
      allowNull: false,
      defaultValue: 'pending',
    },
    send_attempts: {
      type: Sequelize.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    failed_reason: {
      type: Sequelize.STRING,
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

  await queryInterface.addIndex('review_tokens', ['booking_id']);
  await queryInterface.addIndex('review_tokens', ['send_status']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('review_tokens');
}
