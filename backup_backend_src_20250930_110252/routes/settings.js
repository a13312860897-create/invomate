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
router.use(requireEmailVerification);

/**
 * @route GET /api/settings/profile
 * @desc Get user profile settings
 * @access Private
 */
router.get('/profile', async (req, res) => {
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
        message: 'Utilisateur non trouvé'
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
      message: 'Erreur lors de la récupération du profil'
    });
  }
});

/**
 * @route PUT /api/settings/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', async (req, res) => {
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
      language,
      timezone
    } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Store old values for audit log
    const oldValues = {
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      vatNumber: user.vatNumber
    };

    // Update user profile
    await User.update({
      firstName,
      lastName,
      companyName,
      phone,
      address,
      city,
      postalCode,
      country,
      vatNumber,
      siren: sirenNumber,
      siretNumber,
      legalForm,
      registeredCapital,
      language,
      timezone
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
      message: 'Profil mis à jour avec succès',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
});

// 税务设置功能已移除 - 用户反馈该功能无用



/**
 * @route POST /api/settings/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Les nouveaux mots de passe ne correspondent pas'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Get user with password
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
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
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
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
    // 暂时返回默认免费计划，因为Subscription模型尚未实现
    // const subscription = await Subscription.findOne({
    //   where: { userId: req.user.id }
    // });

    // Return default free plan
    return res.json({
      success: true,
      data: {
        plan: 'free',
        status: 'active',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        features: {
          maxInvoices: 5,
          maxClients: 10,
          emailSupport: false,
          customBranding: false,
          advancedReports: false
        }
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'abonnement'
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
      message: 'Données exportées avec succès',
      data: userData,
      exportDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'exportation des données'
    });
  }
});

/**
 * @route DELETE /api/settings/account
 * @desc Delete user account (GDPR compliance)
 * @access Private
 */
router.delete('/account', async (req, res) => {
  try {
    const { password, confirmDeletion } = req.body;

    if (!password || confirmDeletion !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation requise pour supprimer le compte'
      });
    }

    // Get user with password
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe incorrect'
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
      message: 'Compte supprimé avec succès'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du compte'
    });
  }
});

module.exports = router;