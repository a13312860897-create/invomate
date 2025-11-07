const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 获取发票模式设置
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();
    
    if (!settings) {
      // 创建默认设置
      settings = await prisma.settings.create({
        data: {
          invoiceMode: 'intl',
          modeConfig: {
            fr: {
              companyName: '',
              companyAddress: '',
              taxId: '',
              siren: ''
            },

            intl: {
              companyName: '',
              companyAddress: '',
              taxId: ''
            }
          }
        }
      });
    }
    
    res.json({
      invoiceMode: settings.invoiceMode,
      modeConfig: settings.modeConfig
    });
  } catch (error) {
    console.error('Error fetching invoice mode settings:', error);
    res.status(500).json({ error: 'Failed to fetch invoice mode settings' });
  }
});

// 更新发票模式设置
router.put('/', async (req, res) => {
  try {
    const { invoiceMode, modeConfig } = req.body;
    
    let settings = await prisma.settings.findFirst();
    
    if (settings) {
      // 更新现有设置
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          invoiceMode,
          modeConfig
        }
      });
    } else {
      // 创建新设置
      settings = await prisma.settings.create({
        data: {
          invoiceMode,
          modeConfig
        }
      });
    }
    
    res.json({
      invoiceMode: settings.invoiceMode,
      modeConfig: settings.modeConfig
    });
  } catch (error) {
    console.error('Error updating invoice mode settings:', error);
    res.status(500).json({ error: 'Failed to update invoice mode settings' });
  }
});

module.exports = router;