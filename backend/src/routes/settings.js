const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, TaxSetting } = require('../models');
const { authenticateToken, requireEmailVerification, checkFeatureAccess } = require('../middleware/auth');
const { logAuditEvent, AUDIT_ACTIONS } = require('../middleware/auditLogger');
const { sendPasswordResetEmail } = require('../services/emailService');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
// Note: requireEmailVerification is now applied per route as needed

/**
 * @route GET /api/settings/profile
 * @desc Get user profile settings
 * @access Private
 */
router.get('/profile', requireEmailVerification, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
      // include: [{
      //   model: Subscription,
      //   attributes: ['plan', 'status', 'currentPeriodEnd', 'cancelAtPeriodEnd']
      // }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile'
    });
  }
});

/**
 * @route PUT /api/settings/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', requireEmailVerification, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      companyName,
      phone,
      address,
      city,
      postalCode,
      country,
      vatNumber,
      sirenNumber,
      siretNumber,
      legalForm,
      registeredCapital,
      rcsNumber,
      nafCode,
      language,
      timezone,
      bankIBAN,
      bankBIC,
      bankName,
      accountHolder
    } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    

    // Store old values for audit log
    const oldValues = {
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      vatNumber: user.vatNumber
    };

    const normalize = (v) => (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) ? null : v;

    // Update user profile
    await User.update({
      firstName: normalize(firstName),
      lastName: normalize(lastName),
      companyName: normalize(companyName),
      phone: normalize(phone),
      address: normalize(address),
      city: normalize(city),
      postalCode: normalize(postalCode),
      country: normalize(country),
      vatNumber: normalize(vatNumber),
      siren: normalize(sirenNumber),
      siretNumber: normalize(siretNumber),
      legalForm: normalize(legalForm),
      registeredCapital: normalize(registeredCapital),
      rcsNumber: normalize(rcsNumber),
      nafCode: normalize(nafCode),
      language: normalize(language),
      timezone: normalize(timezone),
      bankIBAN: normalize(bankIBAN),
      bankBIC: normalize(bankBIC),
      bankName: normalize(bankName),
      accountHolder: normalize(accountHolder)
    }, {
      where: { id: req.user.id }
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      AUDIT_ACTIONS.PROFILE_UPDATED,
      {
        oldValues,
        newValues: {
          firstName,
          lastName,
          companyName,
          vatNumber
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    // Return updated user without sensitive data
    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// 税务设置功能已移除 - 用户反馈该功能无用



/**
 * @route POST /api/settings/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', requireEmailVerification, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await user.update({
      password: hashedNewPassword,
      passwordChangedAt: new Date()
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      AUDIT_ACTIONS.PASSWORD_CHANGED,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

/**
 * @route GET /api/settings/subscription
 * @desc Get subscription details
 * @access Private
 */
router.get('/subscription', async (req, res) => {
  try {
    const user = req.user;
    
    // 获取用户的订阅状态
    const subscriptionType = user.subscription || 'free';
    const subscriptionStatus = user.subscriptionStatus || 'inactive';
    const subscriptionEndDate = user.subscriptionEndDate;
    const now = new Date();
    
    // 确定计划类型和状态
    let plan = subscriptionType || 'free';
    let status = 'inactive';
    let features = {
      maxInvoices: -1, // 无限制，改为14天试用期限制
      maxClients: -1, // 无限制，改为14天试用期限制
      emailSupport: true, // 试用期内可用
      customBranding: true, // 试用期内可用
      advancedReports: true // 试用期内可用
    };
    
    // 如果用户有付费订阅且未过期
    if (plan !== 'free' && subscriptionEndDate && new Date(subscriptionEndDate) > now) {
      status = 'active';
      features = {
        maxInvoices: -1, // 无限制
        maxClients: -1,  // 无限制
        emailSupport: true,
        customBranding: true,
        advancedReports: true
      };
    } else if (subscriptionEndDate && new Date(subscriptionEndDate) <= now) {
      status = 'expired';
    }

    return res.json({
      success: true,
      data: {
        plan: plan,
        status: status,
        currentPeriodEnd: subscriptionEndDate,
        cancelAtPeriodEnd: false,
        features: features
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving subscription'
    });
  }
});

/**
 * @route POST /api/settings/export-data
 * @desc Export user data (GDPR compliance)
 * @access Private
 */
router.post('/export-data', checkFeatureAccess('data_export'), async (req, res) => {
  try {
    const { User, Client, Invoice, InvoiceItem } = require('../models');
    
    // Get all user data
    const userData = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
      include: [
        {
          model: Client,
          include: [{
            model: Invoice,
            include: [{ model: InvoiceItem }]
          }]
        },
        // { model: TaxSetting }, // 税务设置功能已移除
        // { model: Subscription } // Subscription模型尚未实现
      ]
    });

    // Log audit event
    await logAuditEvent(
      req.user.id,
      AUDIT_ACTIONS.DATA_EXPORTED,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Data exported successfully',
      data: userData,
      exportDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting data'
    });
  }
});

/**
 * @route DELETE /api/settings/account
 * @desc Delete user account (GDPR compliance)
 * @access Private
 */
router.delete('/account', requireEmailVerification, async (req, res) => {
  try {
    const { password, confirmDeletion } = req.body;

    if (!password || confirmDeletion !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required to delete account'
      });
    }

    // Get user with password
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Log audit event before deletion
    await logAuditEvent(
      req.user.id,
      AUDIT_ACTIONS.ACCOUNT_DELETED,
      {
        userEmail: user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    // Delete user account (cascade will handle related data)
    await user.destroy();

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account'
    });
  }
});

module.exports = router;