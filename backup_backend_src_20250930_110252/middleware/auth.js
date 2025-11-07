const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { logAuditEvent, AUDIT_ACTIONS } = require('./auditLogger');

// 开发模式标志
const DEV_MODE = process.env.NODE_ENV === 'development';

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès requis'
      });
    }

    // 开发模式下或使用模拟令牌时接受
    if (token === 'dev-mock-token') {
      req.user = {
        id: 1,
        firstName: '用户',
        lastName: '测试',
        email: 'a133128860897@163.com',
        role: 'admin',
        subscription: 'enterprise',
        subscriptionStatus: 'active',
        emailVerified: true,
        status: 'active'
      };
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Check if user is active
    if (user.status === 'suspended') {
      await logAuditEvent(
        user.id,
        AUDIT_ACTIONS.ACCESS_DENIED,
        {
          reason: 'Account suspended',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl
        }
      );

      return res.status(403).json({
        success: false,
        message: 'Compte suspendu'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    if (DEV_MODE && token === 'dev-mock-token') {
      req.user = {
        id: 1,
        firstName: 'Développeur',
        lastName: 'Test',
        email: 'dev@example.com',
        role: 'admin',
        subscription: 'enterprise',
        subscriptionStatus: 'active',
        emailVerified: true,
        status: 'active'
      };
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });

    req.user = user || null;
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    req.user = null;
    next();
  }
};

// Check if user email is verified
const requireEmailVerification = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Veuillez vérifier votre adresse email avant de continuer',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

// Check subscription level
const requireSubscription = (requiredLevel = 'pro') => {
  return async (req, res, next) => {
    const user = req.user;
    
    // Define subscription hierarchy
    const subscriptionLevels = {
      'free': 0,
      'pro': 1,
      'enterprise': 2
    };

    const userLevel = subscriptionLevels[user.subscription] || 0;
    const requiredLevelValue = subscriptionLevels[requiredLevel] || 0;

    if (userLevel < requiredLevelValue) {
      await logAuditEvent(
        user.id,
        AUDIT_ACTIONS.ACCESS_DENIED,
        {
          reason: `Insufficient subscription level: ${user.subscription} < ${requiredLevel}`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl
        }
      );

      return res.status(403).json({
        success: false,
        message: `Cette fonctionnalité nécessite un abonnement ${requiredLevel}`,
        code: 'INSUFFICIENT_SUBSCRIPTION',
        data: {
          currentSubscription: user.subscription,
          requiredSubscription: requiredLevel
        }
      });
    }

    next();
  };
};

// Check if subscription is active
const requireActiveSubscription = (req, res, next) => {
  const user = req.user;
  
  if (user.subscriptionStatus !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Abonnement inactif ou expiré',
      code: 'SUBSCRIPTION_INACTIVE',
      data: {
        subscriptionStatus: user.subscriptionStatus
      }
    });
  }

  next();
};

// Rate limiting for free users
const freemiumRateLimit = (maxRequests = 100, windowMs = 60 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const user = req.user;
    
    // Skip rate limiting for paid users
    if (user.subscription !== 'free') {
      return next();
    }

    const userId = user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart);
      requests.set(userId, userRequests);
    } else {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId);

    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Limite de requêtes atteinte pour les comptes gratuits',
        code: 'RATE_LIMIT_EXCEEDED',
        data: {
          maxRequests,
          windowMs,
          upgradeMessage: 'Passez à un compte Pro pour des limites plus élevées'
        }
      });
    }

    // Add current request
    userRequests.push(now);
    requests.set(userId, userRequests);

    next();
  };
};

// Check feature access based on subscription
const checkFeatureAccess = (feature) => {
  const featureMatrix = {
    'advanced_reporting': ['pro', 'enterprise'],
    'bulk_operations': ['pro', 'enterprise'],
    'api_access': ['pro', 'enterprise'],
    'custom_branding': ['enterprise'],
    'priority_support': ['enterprise'],
    'unlimited_invoices': ['pro', 'enterprise'],
    'multi_currency': ['pro', 'enterprise'],
    'automated_reminders': ['pro', 'enterprise']
  };

  return (req, res, next) => {
    const user = req.user;
    const allowedSubscriptions = featureMatrix[feature] || [];

    if (!allowedSubscriptions.includes(user.subscription)) {
      return res.status(403).json({
        success: false,
        message: `La fonctionnalité '${feature}' n'est pas disponible avec votre abonnement actuel`,
        code: 'FEATURE_NOT_AVAILABLE',
        data: {
          feature,
          currentSubscription: user.subscription,
          requiredSubscriptions: allowedSubscriptions
        }
      });
    }

    next();
  };
};

// Admin only access
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès administrateur requis'
    });
  }
  next();
};

// Check invoice ownership
const checkInvoiceOwnership = async (req, res, next) => {
  try {
    const { Invoice } = require('../models');
    const invoiceId = parseInt(req.params.id || req.params.invoiceId, 10);
    const userId = parseInt(req.user.id, 10);

    const invoice = await Invoice.findOne({
      where: { id: invoiceId, userId }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Facture non trouvée ou accès non autorisé'
      });
    }

    req.invoice = invoice;
    next();
  } catch (error) {
    console.error('Invoice ownership check error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des droits'
    });
  }
};

// Check client ownership
const checkClientOwnership = async (req, res, next) => {
  try {
    const { Client } = require('../models');
    const clientId = req.params.id || req.params.clientId;
    const userId = req.user.id;

    const client = await Client.findOne({
      where: { id: clientId, userId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé ou accès non autorisé'
      });
    }

    req.client = client;
    next();
  } catch (error) {
    console.error('Client ownership check error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des droits'
    });
  }
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireEmailVerification,
  requireSubscription,
  requireActiveSubscription,
  freemiumRateLimit,
  checkFeatureAccess,
  requireAdmin,
  checkInvoiceOwnership,
  checkClientOwnership
};