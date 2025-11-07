/**
 * 数据验证中间件
 * 提供常用的数据验证功能
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * 处理验证错误的中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '请求参数验证失败',
      errors: errors.array()
    });
  }
  next();
};

/**
 * 验证集成数据的中间件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件
 */
const validateIntegrationData = (req, res, next) => {
  const { platform, config } = req.body;
  
  // 基本验证
  if (!platform) {
    return res.status(400).json({
      success: false,
      message: '平台名称不能为空'
    });
  }
  
  // 根据平台验证配置
  if (platform === 'hubspot') {
    if (!config || !config.apiKey) {
      return res.status(400).json({
        success: false,
        message: 'HubSpot集成需要API密钥'
      });
    }
    
    // 验证API密钥格式
    if (typeof config.apiKey !== 'string' || config.apiKey.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'HubSpot API密钥格式无效'
      });
    }
  }
  
  next();
};

/**
 * 验证用户ID参数
 */
const validateUserId = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('用户ID必须是正整数'),
  handleValidationErrors
];

/**
 * 验证集成ID参数
 */
const validateIntegrationId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('集成ID必须是正整数'),
  handleValidationErrors
];

/**
 * 验证邮箱格式
 */
const validateEmail = [
  body('email')
    .isEmail()
    .withMessage('邮箱格式无效')
    .normalizeEmail(),
  handleValidationErrors
];

/**
 * 验证密码强度
 */
const validatePassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码长度至少8位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('密码必须包含大小写字母和数字'),
  handleValidationErrors
];

/**
 * 验证分页参数
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码必须是正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量必须在1-100之间'),
  handleValidationErrors
];

/**
 * 验证日期范围
 */
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('开始日期格式无效'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('结束日期格式无效'),
  handleValidationErrors
];

/**
 * 验证JSON格式
 * @param {string} field - 字段名
 * @returns {Array} 验证规则数组
 */
const validateJSON = (field) => [
  body(field)
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error(`${field}必须是有效的JSON格式`);
        }
      } else if (typeof value !== 'object') {
        throw new Error(`${field}必须是对象或JSON字符串`);
      }
      return true;
    }),
  handleValidationErrors
];

/**
 * 验证文件上传
 */
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: '请选择要上传的文件'
    });
  }
  
  // 验证文件大小（10MB限制）
  const maxSize = 10 * 1024 * 1024;
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: '文件大小不能超过10MB'
    });
  }
  
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: '不支持的文件类型'
    });
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  validateIntegrationData,
  validateUserId,
  validateIntegrationId,
  validateEmail,
  validatePassword,
  validatePagination,
  validateDateRange,
  validateJSON,
  validateFileUpload
};