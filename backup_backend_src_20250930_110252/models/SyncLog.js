const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SyncLog = sequelize.define('SyncLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  integration_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'integrations',
      key: 'id'
    }
  },
  sync_type: {
    type: DataTypes.ENUM('manual', 'scheduled', 'webhook', 'realtime'),
    allowNull: false,
    comment: '同步类型'
  },
  entity_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '实体类型 (client, invoice, project等)'
  },
  entity_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '本地实体ID（批量操作时可为空）'
  },
  external_entity_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '外部实体ID'
  },
  operation: {
    type: DataTypes.ENUM('create', 'update', 'delete', 'read'),
    allowNull: false,
    comment: '操作类型'
  },
  direction: {
    type: DataTypes.ENUM('inbound', 'outbound'),
    allowNull: false,
    comment: '同步方向'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'success', 'error', 'skipped'),
    allowNull: false,
    defaultValue: 'pending',
    comment: '同步状态'
  },
  request_data: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '请求数据'
  },
  response_data: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '响应数据'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '错误信息'
  },
  error_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '错误代码'
  },
  retry_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '重试次数'
  },
  max_retries: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    comment: '最大重试次数'
  },
  next_retry_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '下次重试时间'
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '开始处理时间'
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '完成时间'
  },
  duration_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '处理耗时（毫秒）'
  },
  batch_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '批次ID（用于批量操作）'
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '额外元数据'
  }
}, {
  tableName: 'sync_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['integration_id']
    },
    {
      fields: ['sync_type']
    },
    {
      fields: ['entity_type']
    },
    {
      fields: ['entity_id']
    },
    {
      fields: ['operation']
    },
    {
      fields: ['direction']
    },
    {
      fields: ['status']
    },
    {
      fields: ['batch_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['next_retry_at']
    },
    {
      fields: ['integration_id', 'status']
    },
    {
      fields: ['integration_id', 'entity_type', 'status']
    }
  ]
});

// 实例方法
SyncLog.prototype.markProcessing = function() {
  this.status = 'processing';
  this.started_at = new Date();
  return this.save();
};

SyncLog.prototype.markSuccess = function(responseData = null) {
  this.status = 'success';
  this.completed_at = new Date();
  this.response_data = responseData;
  this.error_message = null;
  this.error_code = null;
  
  if (this.started_at) {
    this.duration_ms = new Date() - new Date(this.started_at);
  }
  
  return this.save();
};

SyncLog.prototype.markError = function(errorMessage, errorCode = null, responseData = null) {
  this.status = 'error';
  this.completed_at = new Date();
  this.error_message = errorMessage;
  this.error_code = errorCode;
  this.response_data = responseData;
  
  if (this.started_at) {
    this.duration_ms = new Date() - new Date(this.started_at);
  }
  
  // 设置重试时间（指数退避）
  if (this.retry_count < this.max_retries) {
    const backoffMs = Math.pow(2, this.retry_count) * 60000; // 1分钟, 2分钟, 4分钟...
    this.next_retry_at = new Date(Date.now() + backoffMs);
  }
  
  return this.save();
};

SyncLog.prototype.markSkipped = function(reason) {
  this.status = 'skipped';
  this.completed_at = new Date();
  this.error_message = reason;
  
  if (this.started_at) {
    this.duration_ms = new Date() - new Date(this.started_at);
  }
  
  return this.save();
};

SyncLog.prototype.incrementRetry = function() {
  this.retry_count += 1;
  this.status = 'pending';
  this.started_at = null;
  this.completed_at = null;
  this.duration_ms = null;
  return this.save();
};

SyncLog.prototype.canRetry = function() {
  return this.status === 'error' && 
         this.retry_count < this.max_retries && 
         (!this.next_retry_at || new Date() >= new Date(this.next_retry_at));
};

SyncLog.prototype.isCompleted = function() {
  return ['success', 'error', 'skipped'].includes(this.status) && 
         (this.status !== 'error' || this.retry_count >= this.max_retries);
};

// 类方法
SyncLog.findByIntegration = function(integrationId, options = {}) {
  const where = { integration_id: integrationId };
  
  if (options.status) {
    where.status = options.status;
  }
  
  if (options.entityType) {
    where.entity_type = options.entityType;
  }
  
  if (options.batchId) {
    where.batch_id = options.batchId;
  }
  
  return this.findAll({
    where,
    order: [['created_at', 'DESC']],
    limit: options.limit || 100
  });
};

SyncLog.findPendingRetries = function() {
  return this.findAll({
    where: {
      status: 'error',
      retry_count: {
        [sequelize.Sequelize.Op.lt]: sequelize.Sequelize.col('max_retries')
      },
      next_retry_at: {
        [sequelize.Sequelize.Op.lte]: new Date()
      }
    },
    order: [['next_retry_at', 'ASC']]
  });
};

SyncLog.findByBatch = function(batchId) {
  return this.findAll({
    where: { batch_id: batchId },
    order: [['created_at', 'ASC']]
  });
};

SyncLog.getStats = function(integrationId, startDate = null, endDate = null) {
  const where = { integration_id: integrationId };
  
  if (startDate && endDate) {
    where.created_at = {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    };
  }
  
  return this.findAll({
    where,
    attributes: [
      'status',
      'operation',
      'direction',
      'entity_type',
      [sequelize.Sequelize.fn('COUNT', '*'), 'count'],
      [sequelize.Sequelize.fn('AVG', sequelize.Sequelize.col('duration_ms')), 'avg_duration']
    ],
    group: ['status', 'operation', 'direction', 'entity_type'],
    raw: true
  });
};

SyncLog.createBatch = function(logs, batchId = null) {
  if (!batchId) {
    batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  const logsWithBatch = logs.map(log => ({
    ...log,
    batch_id: batchId
  }));
  
  return this.bulkCreate(logsWithBatch);
};

SyncLog.cleanupOldLogs = function(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.destroy({
    where: {
      created_at: {
        [sequelize.Sequelize.Op.lt]: cutoffDate
      },
      status: ['success', 'skipped']
    }
  });
};

module.exports = SyncLog;