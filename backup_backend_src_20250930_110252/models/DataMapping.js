const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DataMapping = sequelize.define('DataMapping', {
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
  local_entity: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '本地实体类型 (client, invoice, project, task等)'
  },
  local_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '本地实体ID'
  },
  external_entity: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '外部实体类型 (account, contact, opportunity等)'
  },
  external_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '外部实体ID'
  },
  mapping_data: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '映射元数据（字段映射、同步规则等）'
  },
  sync_direction: {
    type: DataTypes.ENUM('inbound', 'outbound', 'bidirectional'),
    allowNull: false,
    defaultValue: 'bidirectional',
    comment: '同步方向'
  },
  last_synced_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后同步时间'
  },
  local_updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '本地数据最后更新时间'
  },
  external_updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '外部数据最后更新时间'
  },
  sync_status: {
    type: DataTypes.ENUM('synced', 'pending', 'conflict', 'error'),
    allowNull: false,
    defaultValue: 'synced',
    comment: '同步状态'
  },
  conflict_data: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: '冲突数据（当存在同步冲突时）'
  }
}, {
  tableName: 'data_mappings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['integration_id']
    },
    {
      fields: ['local_entity', 'local_id']
    },
    {
      fields: ['external_entity', 'external_id']
    },
    {
      unique: true,
      fields: ['integration_id', 'local_entity', 'local_id'],
      name: 'unique_integration_local_entity'
    },
    {
      unique: true,
      fields: ['integration_id', 'external_entity', 'external_id'],
      name: 'unique_integration_external_entity'
    },
    {
      fields: ['sync_status']
    },
    {
      fields: ['last_synced_at']
    }
  ]
});

// 实例方法
DataMapping.prototype.needsSync = function() {
  if (this.sync_status === 'pending' || this.sync_status === 'error') {
    return true;
  }
  
  if (!this.last_synced_at) {
    return true;
  }
  
  // 检查是否有更新的数据
  if (this.local_updated_at && this.last_synced_at < this.local_updated_at) {
    return true;
  }
  
  if (this.external_updated_at && this.last_synced_at < this.external_updated_at) {
    return true;
  }
  
  return false;
};

DataMapping.prototype.hasConflict = function() {
  return this.sync_status === 'conflict' && this.conflict_data;
};

DataMapping.prototype.markSynced = function() {
  this.sync_status = 'synced';
  this.last_synced_at = new Date();
  this.conflict_data = null;
  return this.save();
};

DataMapping.prototype.markConflict = function(conflictData) {
  this.sync_status = 'conflict';
  this.conflict_data = conflictData;
  return this.save();
};

DataMapping.prototype.markError = function(errorMessage) {
  this.sync_status = 'error';
  this.conflict_data = { error: errorMessage, timestamp: new Date() };
  return this.save();
};

DataMapping.prototype.updateTimestamps = function(localUpdated = null, externalUpdated = null) {
  if (localUpdated) {
    this.local_updated_at = localUpdated;
  }
  if (externalUpdated) {
    this.external_updated_at = externalUpdated;
  }
  return this.save();
};

// 类方法
DataMapping.findByIntegration = function(integrationId) {
  return this.findAll({
    where: {
      integration_id: integrationId
    }
  });
};

DataMapping.findByLocalEntity = function(integrationId, entityType, entityId) {
  return this.findOne({
    where: {
      integration_id: integrationId,
      local_entity: entityType,
      local_id: entityId
    }
  });
};

DataMapping.findByExternalEntity = function(integrationId, entityType, entityId) {
  return this.findOne({
    where: {
      integration_id: integrationId,
      external_entity: entityType,
      external_id: entityId
    }
  });
};

DataMapping.findPendingSync = function(integrationId, entityType = null) {
  const where = {
    integration_id: integrationId,
    sync_status: ['pending', 'error']
  };
  
  if (entityType) {
    where.local_entity = entityType;
  }
  
  return this.findAll({ where });
};

DataMapping.findConflicts = function(integrationId) {
  return this.findAll({
    where: {
      integration_id: integrationId,
      sync_status: 'conflict'
    }
  });
};

DataMapping.createOrUpdate = async function(data) {
  const existing = await this.findOne({
    where: {
      integration_id: data.integration_id,
      local_entity: data.local_entity,
      local_id: data.local_id
    }
  });
  
  if (existing) {
    return existing.update(data);
  } else {
    return this.create(data);
  }
};

DataMapping.bulkCreateOrUpdate = async function(mappings) {
  const results = [];
  
  for (const mapping of mappings) {
    try {
      const result = await this.createOrUpdate(mapping);
      results.push({ success: true, data: result });
    } catch (error) {
      results.push({ success: false, error: error.message, data: mapping });
    }
  }
  
  return results;
};

module.exports = DataMapping;