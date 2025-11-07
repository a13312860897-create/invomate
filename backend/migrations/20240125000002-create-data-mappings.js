'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建数据映射表
    await queryInterface.createTable('data_mappings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      integration_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'integrations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      local_entity: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '本地实体类型 (client, invoice, project, task等)'
      },
      local_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '本地实体ID'
      },
      external_entity: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '外部实体类型 (account, contact, opportunity等)'
      },
      external_id: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '外部实体ID'
      },
      mapping_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '映射元数据（字段映射、同步规则等）'
      },
      sync_direction: {
        type: Sequelize.ENUM('inbound', 'outbound', 'bidirectional'),
        allowNull: false,
        defaultValue: 'bidirectional',
        comment: '同步方向'
      },
      last_synced_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '最后同步时间'
      },
      local_updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '本地数据最后更新时间'
      },
      external_updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '外部数据最后更新时间'
      },
      sync_status: {
        type: Sequelize.ENUM('synced', 'pending', 'conflict', 'error'),
        allowNull: false,
        defaultValue: 'synced',
        comment: '同步状态'
      },
      conflict_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '冲突数据（当存在同步冲突时）'
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
    await queryInterface.addIndex('data_mappings', ['integration_id']);
    await queryInterface.addIndex('data_mappings', ['local_entity', 'local_id']);
    await queryInterface.addIndex('data_mappings', ['external_entity', 'external_id']);
    await queryInterface.addIndex('data_mappings', ['integration_id', 'local_entity', 'local_id'], {
      unique: true,
      name: 'unique_integration_local_entity'
    });
    await queryInterface.addIndex('data_mappings', ['integration_id', 'external_entity', 'external_id'], {
      unique: true,
      name: 'unique_integration_external_entity'
    });
    await queryInterface.addIndex('data_mappings', ['sync_status']);
    await queryInterface.addIndex('data_mappings', ['last_synced_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('data_mappings');
  }
};