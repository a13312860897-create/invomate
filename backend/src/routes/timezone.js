const express = require('express');
const router = express.Router();
const TimezoneService = require('../services/TimezoneService');

/**
 * 获取用户当前时区信息
 */
router.get('/current', (req, res) => {
  try {
    const userTimezone = req.userTimezone || 'UTC';
    
    res.json({
      success: true,
      data: {
        timezone: userTimezone,
        currentMonth: TimezoneService.getCurrentMonthForTimezone(userTimezone),
        detectedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('获取时区信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取时区信息失败',
      details: error.message
    });
  }
});

/**
 * 获取可用时区列表
 */
router.get('/available', (req, res) => {
  try {
    const timezones = TimezoneService.getCommonTimezones();
    
    res.json({
      success: true,
      data: timezones
    });
  } catch (error) {
    console.error('获取时区列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取时区列表失败',
      details: error.message
    });
  }
});

/**
 * 更新用户时区设置
 */
router.post('/update', async (req, res) => {
  try {
    const { timezone } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '用户未登录'
      });
    }
    
    if (!timezone || !TimezoneService.isValidTimezone(timezone)) {
      return res.status(400).json({
        success: false,
        error: '无效的时区设置'
      });
    }
    
    // 更新用户时区设置
    const { User } = require('../models');
    await User.update(
      { timezone },
      { where: { id: userId } }
    );
    
    res.json({
      success: true,
      data: {
        timezone,
        currentMonth: TimezoneService.getCurrentMonthForTimezone(timezone),
        message: '时区设置已更新'
      }
    });
  } catch (error) {
    console.error('更新时区设置失败:', error);
    res.status(500).json({
      success: false,
      error: '更新时区设置失败',
      details: error.message
    });
  }
});

module.exports = router;