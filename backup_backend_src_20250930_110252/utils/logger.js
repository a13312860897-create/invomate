/**
 * 简单的日志工具
 * 提供基本的日志记录功能
 */

const fs = require('fs');
const path = require('path');

// 日志级别
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// 当前日志级别（从环境变量获取，默认为INFO）
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.INFO;

// 日志目录
const LOG_DIR = path.join(__dirname, '../../logs');

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * 格式化日志消息
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} meta - 元数据
 * @returns {string} 格式化后的日志
 */
function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level}] ${message}${metaStr}`;
}

/**
 * 写入日志文件
 * @param {string} level - 日志级别
 * @param {string} message - 日志消息
 * @param {Object} meta - 元数据
 */
function writeToFile(level, message, meta = {}) {
  try {
    const logFile = path.join(LOG_DIR, `${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = formatLog(level, message, meta) + '\n';
    fs.appendFileSync(logFile, logEntry);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

/**
 * 日志记录器类
 */
class Logger {
  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  static error(message, meta = {}) {
    if (CURRENT_LEVEL >= LOG_LEVELS.ERROR) {
      console.error(formatLog('ERROR', message, meta));
      writeToFile('ERROR', message, meta);
    }
  }

  /**
   * 记录警告日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  static warn(message, meta = {}) {
    if (CURRENT_LEVEL >= LOG_LEVELS.WARN) {
      console.warn(formatLog('WARN', message, meta));
      writeToFile('WARN', message, meta);
    }
  }

  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  static info(message, meta = {}) {
    if (CURRENT_LEVEL >= LOG_LEVELS.INFO) {
      console.log(formatLog('INFO', message, meta));
      writeToFile('INFO', message, meta);
    }
  }

  /**
   * 记录调试日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  static debug(message, meta = {}) {
    if (CURRENT_LEVEL >= LOG_LEVELS.DEBUG) {
      console.log(formatLog('DEBUG', message, meta));
      writeToFile('DEBUG', message, meta);
    }
  }

  /**
   * 记录日志（通用方法）
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  static log(level, message, meta = {}) {
    const levelUpper = level.toUpperCase();
    if (LOG_LEVELS[levelUpper] !== undefined && CURRENT_LEVEL >= LOG_LEVELS[levelUpper]) {
      console.log(formatLog(levelUpper, message, meta));
      writeToFile(levelUpper, message, meta);
    }
  }
}

module.exports = Logger;