'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 创建同步日志表
    await queryInterface.createTable('sync_logs', {
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
      sync_type: {
        type: Sequelize.ENUM('manual', 'scheduled', 'webhook', 'realtime'),
        allowNull: false,
        comment: '同步类型'
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '实体类型 (client, invoice, project, task等)'
      },
      operation: {
        type: Sequelize.ENUM('create', 'update', 'delete', 'sync'),
        allowNull: false,
        comment: '操作类型'
      },
      direction: {
        type: Sequelize.ENUM('inbound', 'outbound', 'bidirectional'),
        allowNull: false,
        comment: '同步方向'
      },
      status: {
        type: Sequelize.ENUM('pending', 'running', 'success', 'failed', 'partial'),
        allowNull: false,
        comment: '同步状态'
      },
      records_processed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '处理的记录数'
      },
      records_success: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '成功处理的记录数'
      },
      records_failed: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '失败的记录数'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '开始时间'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: '完成时间'
      },
      duration_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '执行时长（毫秒）'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '错误信息'
      },
      error_details: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '详细错误信息'
      },
      sync_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '同步数据详情'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '元数据（API调用次数、限流信息等）'
      },
      triggered_by: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '触发者（用户ID、系统、webhook等）'
      },
      batch_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '批次ID（用于关联批量操作）'
      },
      parent_log_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'sync_logs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '父日志ID（用于嵌套操作）'
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
    await queryInterface.addIndex('sync_logs', ['integration_id']);
    await queryInterface.addIndex('sync_logs', ['sync_type']);
    await queryInterface.addIndex('sync_logs', ['entity_type']);
    await queryInterface.addIndex('sync_logs', ['operation']);
    await queryInterface.addIndex('sync_logs', ['status']);
    await queryInterface.addIndex('sync_logs', ['created_at']);
    await queryInterface.addIndex('sync_logs', ['started_at']);
    await queryInterface.addIndex('sync_logs', ['completed_at']);
    await queryInterface.addIndex('sync_logs', ['batch_id']);
    await queryInterface.addIndex('sync_logs', ['parent_log_id']);
    await queryInterface.addIndex('sync_logs', ['triggered_by']);
    
    // 复合索引
    await queryInterface.addIndex('sync_logs', ['integration_id', 'entity_type']);
    await queryInterface.addIndex('sync_logs', ['integration_id', 'status']);
    await queryInterface.addIndex('sync_logs', ['integration_id', 'created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('sync_logs');
  }
};