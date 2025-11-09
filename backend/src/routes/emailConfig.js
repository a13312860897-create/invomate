/**
 * 用户邮件配置路由
 * 提供获取、保存（upsert）以及验证SMTP配置的接口
 */
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { EmailConfig, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// 所有路由均需认证
router.use(authenticateToken);

// 获取当前用户的邮件配置（隐藏密码）
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const config = await EmailConfig.findOne({ where: { userId } });

    if (!config) {
      return res.json({ success: true, data: null });
    }

    const safe = {
      id: config.id,
      userId: config.userId,
      email: config.email,
      provider: config.provider,
      providerName: config.providerName,
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpSecure: !!config.smtpSecure,
      isActive: !!config.isActive,
      isVerified: !!config.isVerified,
      lastTestAt: config.lastTestAt || null,
      hasPassword: !!config.password,
      testResult: config.testResult || null
    };

    return res.json({ success: true, data: safe });
  } catch (error) {
    console.error('[EmailConfig] 获取配置失败:', error);
    res.status(500).json({ success: false, message: error.message || '获取邮件配置失败' });
  }
});

// 保存（upsert）当前用户的邮件配置
router.put('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      email,
      password,
      provider = 'custom',
      providerName = 'custom',
      smtpHost,
      smtpPort = 587,
      smtpSecure = false,
      isActive = true
    } = req.body || {};

    if (!email) {
      return res.status(400).json({ success: false, message: '邮箱地址(email)是必需的' });
    }
    if (!smtpHost) {
      return res.status(400).json({ success: false, message: 'SMTP服务器地址(smtpHost)是必需的' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: '邮箱密码或授权码(password)是必需的' });
    }

    // upsert 配置
    const payload = {
      userId,
      email,
      password,
      provider,
      providerName,
      smtpHost,
      smtpPort: parseInt(smtpPort),
      smtpSecure: !!smtpSecure,
      isActive: !!isActive,
      isVerified: false,
      lastTestAt: null,
      testResult: null
    };

    // Sequelize: upsert 返回 [instance, created]，内存适配器直接返回对象
    const upsertResult = await EmailConfig.upsert ? EmailConfig.upsert(payload) : EmailConfig.create(payload);

    // 为统一返回，重新读取一遍
    const saved = await EmailConfig.findOne({ where: { userId } });
    const safe = saved ? {
      id: saved.id,
      userId: saved.userId,
      email: saved.email,
      provider: saved.provider,
      providerName: saved.providerName,
      smtpHost: saved.smtpHost,
      smtpPort: saved.smtpPort,
      smtpSecure: !!saved.smtpSecure,
      isActive: !!saved.isActive,
      isVerified: !!saved.isVerified,
      lastTestAt: saved.lastTestAt || null,
      hasPassword: !!saved.password,
      testResult: saved.testResult || null
    } : null;

    return res.json({ success: true, message: '保存成功', data: safe });
  } catch (error) {
    console.error('[EmailConfig] 保存配置失败:', error);
    res.status(500).json({ success: false, message: error.message || '保存邮件配置失败' });
  }
});

// 验证提供的SMTP配置（不保存）
router.post('/verify', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      email,
      password,
      smtpHost,
      smtpPort = 587,
      smtpSecure = false
    } = req.body || {};

    if (!email || !password || !smtpHost) {
      return res.status(400).json({ success: false, ok: false, message: 'email、password、smtpHost为必填' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: !!smtpSecure,
      auth: { user: email, pass: password },
      debug: true,
      logger: true
    });

    let ok = false;
    let message = '验证成功';
    try {
      await transporter.verify();
      ok = true;
    } catch (err) {
      ok = false;
      message = `验证失败: ${err.message}`;
    }

    // 更新用户配置的测试状态（如果存在且通过认证）
    try {
      const existing = await EmailConfig.findOne({ where: { userId } });
      if (existing) {
        await EmailConfig.update({
          isVerified: ok,
          lastTestAt: new Date(),
          testResult: message
        }, { where: { userId } });
      }
    } catch (_) {}

    return res.json({ success: true, ok, message, data: { ok } });
  } catch (error) {
    console.error('[EmailConfig] 验证配置失败:', error);
    res.status(500).json({ success: false, ok: false, message: error.message || '验证失败' });
  }
});

module.exports = router;