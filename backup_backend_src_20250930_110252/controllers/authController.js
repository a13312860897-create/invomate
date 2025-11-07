const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const { sendWelcomeEmail, sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { logAuditEvent, AUDIT_ACTIONS } = require('../middleware/auditLogger');
const { hashPassword, verifyPassword, generateSecureToken } = require('../utils/encryption');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Register new user
const register = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      companyName,
      vatNumber,
      phone,
      address,
      city,
      postalCode,
      country = 'France'
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, mot de passe, prénom et nom sont requis'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un compte avec cette adresse email existe déjà'
      });
    }

    // Validate VAT number format (French format)
    if (vatNumber) {
      const vatRegex = /^FR\d{11}$/;
      if (!vatRegex.test(vatNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Format de numéro de TVA invalide (format attendu: FR + 11 chiffres)'
        });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateSecureToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      companyName,
      vatNumber,
      phone,
      address,
      city,
      postalCode,
      country,
      emailVerified: false,
      verificationToken,
      verificationExpires,
      subscription: 'free',
      subscriptionStatus: 'active'
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.id, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    // Log audit event
    await logAuditEvent(
      user.id,
      AUDIT_ACTIONS.USER_REGISTERED,
      {
        email: user.email,
        companyName: user.companyName,
        country: user.country,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken();

    // Update user with refresh token
    await User.update({ refreshToken }, { where: { id: user.id } });

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès. Veuillez vérifier votre email.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName,
          emailVerified: user.emailVerified,
          subscription: user.subscription
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      await logAuditEvent(
        null,
        AUDIT_ACTIONS.LOGIN_FAILED,
        {
          email,
          reason: 'User not found',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      await logAuditEvent(
        user.id,
        AUDIT_ACTIONS.LOGIN_FAILED,
        {
          email,
          reason: 'Invalid password',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken();

    // Update user with refresh token and last login
    if (process.env.DB_TYPE === 'memory') {
      const memoryDb = require('../config/memoryDatabase');
      memoryDb.updateUser(user.id, {
        refreshToken,
        lastLogin: new Date()
      });
    } else {
      await user.update({
        refreshToken,
        lastLogin: new Date()
      });
    }

    // Log successful login
    await logAuditEvent(
      user.id,
      AUDIT_ACTIONS.USER_LOGIN,
      {
        email: user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyName: user.companyName,
          emailVerified: user.emailVerified,
          subscription: user.subscription,
          subscriptionStatus: user.subscriptionStatus
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de vérification requis'
      });
    }

    // Find user with verification token
    const user = await User.findOne({
      where: {
        verificationToken: token,
        verificationExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de vérification invalide ou expiré'
      });
    }

    // Update user as verified
    await user.update({
      emailVerified: true,
      verificationToken: null,
      verificationExpires: null
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(user.id);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Log audit event
    await logAuditEvent(
      user.id,
      AUDIT_ACTIONS.EMAIL_VERIFIED,
      {
        email: user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Email vérifié avec succès'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de l\'email'
    });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return res.json({
        success: true,
        message: 'Si un compte avec cette adresse email existe, un email de réinitialisation a été envoyé'
      });
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires
    });

    // Send reset email
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de réinitialisation'
      });
    }

    // Log audit event
    await logAuditEvent(
      user.id,
      AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
      {
        email: user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Si un compte avec cette adresse email existe, un email de réinitialisation a été envoyé'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la demande de réinitialisation'
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token et nouveau mot de passe requis'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    // Find user with reset token
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token de réinitialisation invalide ou expiré'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and clear reset token
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      refreshToken: null // Invalidate existing sessions
    });

    // Log audit event
    await logAuditEvent(
      user.id,
      AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
      {
        email: user.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe'
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requis'
      });
    }

    // Find user with refresh token
    const user = await User.findOne({ where: { refreshToken } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalide'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken();

    // Update user with new refresh token
    await user.update({ refreshToken: newRefreshToken });

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du renouvellement du token'
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    // Clear refresh token
    await User.update(
      { refreshToken: null },
      { where: { id: userId } }
    );

    // Log audit event
    await logAuditEvent(
      userId,
      AUDIT_ACTIONS.USER_LOGOUT,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'refreshToken', 'verificationToken', 'resetPasswordToken'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  refreshToken,
  logout,
  getProfile
};