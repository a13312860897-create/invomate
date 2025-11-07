/**
 * 法国主要邮箱服务商SMTP配置
 * French Email Providers SMTP Configuration
 */

const FRENCH_EMAIL_CONFIGS = {
  // 法国本土邮箱服务商
  orange: {
    name: 'Orange',
    domain: '@orange.fr',
    smtp: {
      host: 'smtp.orange.fr',
      port: 465,
      secure: true, // SSL
      auth: {
        // user 和 pass 需要在运行时设置
      }
    },
    description: '法国最大电信运营商Orange的邮箱服务'
  },

  free: {
    name: 'Free',
    domain: '@free.fr',
    smtp: {
      host: 'smtp.free.fr',
      port: 465,
      secure: true, // SSL
      auth: {
        // user 和 pass 需要在运行时设置
      }
    },
    description: '法国主要ISP Free的邮箱服务'
  },

  sfr: {
    name: 'SFR',
    domain: '@sfr.fr',
    smtp: {
      host: 'smtp.sfr.fr',
      port: 465,
      secure: true, // SSL
      auth: {
        // user 和 pass 需要在运行时设置
      }
    },
    description: '法国电信运营商SFR的邮箱服务'
  },

  laposte: {
    name: 'LaPoste',
    domain: '@laposte.net',
    smtp: {
      host: 'smtp.laposte.net',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        // user 和 pass 需要在运行时设置
      }
    },
    description: '法国邮政LaPoste的邮箱服务'
  },

  bouygues: {
    name: 'Bouygues Telecom',
    domain: '@bbox.fr',
    smtp: {
      host: 'smtp.bbox.fr',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        // user 和 pass 需要在运行时设置
      }
    },
    description: 'Bouygues Telecom的邮箱服务'
  },

  // 国际邮箱服务商（在法国常用）
  gmail: {
    name: 'Gmail',
    domain: '@gmail.com',
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        // user 和 pass 需要在运行时设置
      }
    },
    description: 'Google Gmail邮箱服务',
    note: '需要使用应用专用密码，不是登录密码'
  },

  outlook: {
    name: 'Outlook',
    domain: '@outlook.com',
    smtp: {
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        // user 和 pass 需要在运行时设置
      }
    },
    description: 'Microsoft Outlook邮箱服务'
  },

  hotmail: {
    name: 'Hotmail',
    domain: '@hotmail.com',
    smtp: {
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        // user 和 pass 需要在运行时设置
      }
    },
    description: 'Microsoft Hotmail邮箱服务'
  },

  yahoo: {
    name: 'Yahoo Mail',
    domain: '@yahoo.fr',
    smtp: {
      host: 'smtp.mail.yahoo.com',
      port: 587,
      secure: false, // STARTTLS
      auth: {
        // user 和 pass 需要在运行时设置
      }
    },
    description: 'Yahoo邮箱服务',
    note: '需要使用应用专用密码'
  }
};

/**
 * 根据邮箱地址自动检测邮箱服务商
 * @param {string} email - 邮箱地址
 * @returns {Object|null} - 邮箱配置对象或null
 */
function detectEmailProvider(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const domain = email.toLowerCase().split('@')[1];
  if (!domain) {
    return null;
  }

  // 查找匹配的邮箱服务商
  for (const [key, config] of Object.entries(FRENCH_EMAIL_CONFIGS)) {
    if (config.domain === `@${domain}`) {
      return { key, ...config };
    }
  }

  return null;
}

/**
 * 获取SMTP配置
 * @param {string} email - 邮箱地址
 * @param {string} password - 邮箱密码或授权码
 * @returns {Object|null} - SMTP配置对象或null
 */
function getSMTPConfig(email, password) {
  const provider = detectEmailProvider(email);
  if (!provider) {
    return null;
  }

  return {
    ...provider.smtp,
    auth: {
      user: email,
      pass: password
    }
  };
}

/**
 * 获取所有支持的邮箱服务商列表
 * @returns {Array} - 邮箱服务商列表
 */
function getSupportedProviders() {
  return Object.entries(FRENCH_EMAIL_CONFIGS).map(([key, config]) => ({
    key,
    name: config.name,
    domain: config.domain,
    description: config.description,
    note: config.note
  }));
}

module.exports = {
  FRENCH_EMAIL_CONFIGS,
  detectEmailProvider,
  getSMTPConfig,
  getSupportedProviders
};