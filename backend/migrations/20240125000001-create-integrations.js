'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建集成配置表
    await queryInterface.createTable('integrations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      platform: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '集成平台名称 (salesforce, hubspot, trello等)'
      },
      platform_type: {
        type: Sequelize.ENUM('crm', 'project_management'),
        allowNull: false,
        comment: '平台类型'
      },
      config: {
        type: Sequelize.JSONB,
        allowNull: false,
        comment: '集成配置信息（不包含敏感信息）'
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '访问令牌（加密存储）'
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '刷新令牌（加密存储）'
      },
      token_expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '令牌过期时间'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否启用'
      },
      last_sync_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '最后同步时间'
      },
      sync_status: {
        type: Sequelize.ENUM('idle', 'syncing', 'error'),
        allowNull: false,
        defaultValue: 'idle',
        comment: '同步状态'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '最后的错误信息'
      },
      settings: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: '集成设置（同步频率、字段映射等）'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 添加索引
    await queryInterface.addIndex('integrations', ['user_id']);
    await queryInterface.addIndex('integrations', ['platform']);
    await queryInterface.addIndex('integrations', ['platform_type']);
    await queryInterface.addIndex('integrations', ['user_id', 'platform'], {
      unique: true,
      name: 'unique_user_platform'
    });
    await queryInterface.addIndex('integrations', ['is_active']);
    await queryInterface.addIndex('integrations', ['sync_status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('integrations');
  }
};