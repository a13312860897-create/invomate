const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const {
  authenticateToken,
  requireEmailVerification,
  optionalAuth,
  requireAdmin,
  requireDevMode
} = require('../middleware/auth');
const {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  refreshToken,
  logout,
  getProfile
} = require('../controllers/authController');
const { auditLogger, securityMonitor, logAuditEvent, AUDIT_ACTIONS } = require('../middleware/auditLogger');
const { generateSecureToken } = require('../utils/encryption');
const router = express.Router();
const safeRequireDevMode = (typeof requireDevMode === 'function') ? requireDevMode : (req, res, next) => res.status(404).json({ success: false, message: 'Not found' });

// Apply audit logging to all auth routes
router.use(auditLogger('auth'));
router.use(securityMonitor());

// Public routes
/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', register);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', login);

/**
 * @route POST /api/auth/verify-email
 * @desc Verify user email
 * @access Public
 */
router.post('/verify-email', verifyEmail);

/**
 * @route POST /api/auth/request-password-reset
 * @desc Request password reset
 * @access Public
 */
router.post('/request-password-reset', requestPasswordReset);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', resetPassword);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh-token', refreshToken);

// Protected routes
/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route POST /api/auth/resend-verification
 * @desc Resend email verification
 * @access Private
 */
router.post('/resend-verification', authenticateToken, async (req, res) => {
  try {

    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email déjà vérifié'
      });
    }

    // Generate new verification token
    const verificationToken = generateSecureToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.update({
      verificationToken,
      verificationExpires
    });

    // Send verification email（延迟加载以避免不必要的依赖初始化）
    const { sendVerificationEmail } = require('../services/emailService');
    const emailResult = await sendVerificationEmail(user.id, verificationToken);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de vérification'
      });
    }

    // Log audit event
    await logAuditEvent(
      user.id,
      AUDIT_ACTIONS.VERIFICATION_EMAIL_RESENT,
      {
        email: user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Email de vérification renvoyé'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du renvoi de l\'email de vérification'
    });
  }
});

/**
 * @route POST /api/auth/grant-trial
 * @desc Grant 15-day Professional trial to current user
 * @access Private
 */
router.post('/grant-trial', authenticateToken, safeRequireDevMode, async (req, res) => {
  try {
    const userId = req.user.id;
    const endDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    if (process.env.DB_TYPE === 'memory') {
      const memoryDb = require('../config/memoryDatabase');
      const updated = memoryDb.updateUser(userId, {
        subscription: 'professional',
        subscriptionStatus: 'active',
        subscriptionEndDate: endDate,
      });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }
    } else {
      const { User } = require('../models');
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
      }
      await user.update({ subscription: 'professional', subscriptionStatus: 'active', subscriptionEndDate: endDate });
    }

    return res.json({ success: true, message: 'Trial granted', data: { subscription: 'professional', subscriptionStatus: 'active', subscriptionEndDate: endDate } });
  } catch (error) {
    console.error('Grant trial error:', error);
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'attribution de l\'essai' });
  }
});

/**
 * @route POST /api/auth/dev/force-verify
 * @desc Force verify a user's email in development mode
 * @access Private (dev only)
 */
router.post('/dev/force-verify', authenticateToken, async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: 'Endpoint disponible uniquement en développement'
      });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    await User.update({
      emailVerified: true,
      verificationToken: null,
      verificationExpires: null
    }, { where: { id: user.id } });

    await logAuditEvent(
      user.id,
      AUDIT_ACTIONS.EMAIL_VERIFIED,
      {
        email: user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        reason: 'dev/force-verify'
      }
    );

    return res.json({
      success: true,
      message: 'Email vérifié (dev)'
    });
  } catch (error) {
    console.error('Dev force verify error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification (dev)'
    });
  }
});

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', authenticateToken, requireEmailVerification, async (req, res) => {
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
      currency,
      language
    } = req.body;

    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    

    // Track changes for audit
    const changes = {};
    const fieldsToUpdate = {
      firstName,
      lastName,
      companyName,
      phone,
      address,
      city,
      postalCode,
      country,
      vatNumber,
      currency,
      language
    };

    Object.keys(fieldsToUpdate).forEach(field => {
      if (fieldsToUpdate[field] !== undefined && fieldsToUpdate[field] !== user[field]) {
        changes[field] = {
          from: user[field],
          to: fieldsToUpdate[field]
        };
      }
    });

    // Update user
    await user.update(fieldsToUpdate);

    // Log audit event if there were changes
    if (Object.keys(changes).length > 0) {
      await logAuditEvent(
        user.id,
        AUDIT_ACTIONS.PROFILE_UPDATED,
        {
          changes,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
    }

    // Return updated user (excluding sensitive fields)
    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password', 'refreshToken', 'verificationToken', 'resetPasswordToken'] }
    });

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    });
  }
});

/**
 * @route PUT /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.put('/change-password', authenticateToken, requireEmailVerification, async (req, res) => {
  try {
    const { User } = require('../models');
    const { verifyPassword, hashPassword } = require('../utils/encryption');
    const { logAuditEvent, AUDIT_ACTIONS } = require('../middleware/auditLogger');
    
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
      });
    }

    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      await logAuditEvent(
        user.id,
        AUDIT_ACTIONS.PASSWORD_CHANGE_FAILED,
        {
          reason: 'Invalid current password',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and invalidate refresh tokens
    await user.update({
      password: hashedPassword,
      refreshToken: null
    });

    // Log audit event
    await logAuditEvent(
      user.id,
      AUDIT_ACTIONS.PASSWORD_CHANGED,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès. Veuillez vous reconnecter.'
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
 * @route DELETE /api/auth/account
 * @desc Delete user account (GDPR compliance)
 * @access Private
 */
router.delete('/account', authenticateToken, requireEmailVerification, async (req, res) => {
  try {
    const { User, Invoice, Client } = require('../models');
    const { logAuditEvent, AUDIT_ACTIONS } = require('../middleware/auditLogger');
    const gdprCompliance = require('../utils/gdprCompliance');
    
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation du mot de passe requise'
      });
    }

    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Verify password
    const { verifyPassword } = require('../utils/encryption');
    const isValidPassword = await verifyPassword(confirmPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    // Log audit event before deletion
    await logAuditEvent(
      user.id,
      AUDIT_ACTIONS.ACCOUNT_DELETED,
      {
        email: user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    // Handle account deletion with GDPR compliance
    await gdprCompliance.handleAccountDeletion(user.id);

    res.json({
      success: true,
      message: 'Compte supprimé avec succès'
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du compte'
    });
  }
});

module.exports = router;
