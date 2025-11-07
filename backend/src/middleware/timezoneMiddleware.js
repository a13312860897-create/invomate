/**
 * 时区检测中间件
 * 自动检测和设置用户的时区信息
 */
const TimezoneService = require('../services/TimezoneService');

const timezoneMiddleware = (req, res, next) => {
  try {
    // 检测用户时区
    const userTimezone = TimezoneService.detectUserTimezone({
      timezoneHeader: req.headers['x-timezone'],
      user: req.user,
      clientTimezone: req.headers['x-client-timezone'],
      ip: req.ip
    });

    // 将时区信息添加到请求对象中
    req.userTimezone = userTimezone;
    
    // 添加时区信息到响应头，供前端使用
    res.setHeader('X-Server-Timezone', userTimezone);
    
    next();
  } catch (error) {
    console.error('时区检测失败:', error);
    // 即使时区检测失败，也继续处理请求，使用默认时区
    req.userTimezone = 'UTC';
    res.setHeader('X-Server-Timezone', 'UTC');
    next();
  }
};

module.exports = timezoneMiddleware;