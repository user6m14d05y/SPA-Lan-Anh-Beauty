export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('review_delivery_logs', {
    id: {
      type: Sequelize.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    review_token_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'review_tokens',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    staff_id: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
    },
    action: {
      type: Sequelize.ENUM('copied_link', 'generated_qr', 'marked_sent'),
      allowNull: false,
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

  await queryInterface.addIndex('review_delivery_logs', ['review_token_id']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('review_delivery_logs');
}
