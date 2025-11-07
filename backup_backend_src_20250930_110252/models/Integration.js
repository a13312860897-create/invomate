const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Integration = sequelize.define('Integration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  platform: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '集成平台名称 (salesforce, hubspot, trello等)'
  },
  platform_type: {
    type: DataTypes.ENUM('crm', 'project_management'),
    allowNull: false,
    comment: '平台类型'
  },
  config: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: '集成配置信息（不包含敏感信息）'
  },
  access_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '访问令牌（加密存储）'
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '刷新令牌（加密存储）'
  },
  token_expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '令牌过期时间'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: '是否启用'
  },
  last_sync_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后同步时间'
  },
  sync_status: {
    type: DataTypes.ENUM('idle', 'syncing', 'error'),
    allowNull: false,
    defaultValue: 'idle',
    comment: '同步状态'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '最后的错误信息'
  },
  settings: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {},
    comment: '集成设置（同步频率、字段映射等）'
  }
}, {
  tableName: 'integrations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['platform']
    },
    {
      fields: ['platform_type']
    },
    {
      unique: true,
      fields: ['user_id', 'platform'],
      name: 'unique_user_platform'
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['sync_status']
    }
  ]
});

// 实例方法
Integration.prototype.isTokenExpired = function() {
  if (!this.token_expires_at) return false;
  return new Date() >= new Date(this.token_expires_at);
};

Integration.prototype.isActive = function() {
  return this.is_active && !this.isTokenExpired();
};

Integration.prototype.getDecryptedConfig = function() {
  // TODO: 实现配置解密逻辑
  return this.config;
};

Integration.prototype.setEncryptedToken = function(token, refreshToken = null) {
  // TODO: 实现令牌加密逻辑
  this.access_token = token;
  if (refreshToken) {
    this.refresh_token = refreshToken;
  }
};

Integration.prototype.updateSyncStatus = function(status, errorMessage = null) {
  this.sync_status = status;
  this.error_message = errorMessage;
  if (status === 'idle') {
    this.last_sync_at = new Date();
  }
  return this.save();
};

// 类方法
Integration.findByUserAndPlatform = function(userId, platform) {
  return this.findOne({
    where: {
      user_id: userId,
      platform: platform
    }
  });
};

Integration.findActiveByUser = function(userId) {
  return this.findAll({
    where: {
      user_id: userId,
      is_active: true
    }
  });
};

Integration.findByType = function(userId, platformType) {
  return this.findAll({
    where: {
      user_id: userId,
      platform_type: platformType,
      is_active: true
    }
  });
};

module.exports = Integration;