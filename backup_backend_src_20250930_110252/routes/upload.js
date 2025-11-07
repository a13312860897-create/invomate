const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { User } = require('../models');
const router = express.Router();

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 确保logos目录存在
const logosDir = path.join(uploadsDir, 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logosDir);
  },
  filename: (req, file, cb) => {
    // 使用用户ID和原始文件名创建唯一文件名
    const userId = req.user.id;
    const fileExtension = path.extname(file.originalname);
    const fileName = `logo_${userId}_${Date.now()}${fileExtension}`;
    cb(null, fileName);
  }
});

// 文件过滤器，只允许图片文件
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 限制文件大小为2MB
  },
  fileFilter: fileFilter
});

// 上传用户logo
router.post('/logo', authenticateToken, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // 获取用户信息
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 如果用户已有logo，删除旧文件
    if (user.logo) {
      const oldLogoPath = path.join(__dirname, '..', user.logo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // 更新用户logo路径
    const logoPath = `/uploads/logos/${req.file.filename}`;
    await User.update({ logo: logoPath }, { where: { id: req.user.id } });

    res.json({
      message: 'Logo uploaded successfully',
      logoUrl: logoPath
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ message: 'Server error during logo upload' });
  }
});

// 删除用户logo
router.delete('/logo', authenticateToken, async (req, res) => {
  try {
    // 获取用户信息
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 如果用户有logo，删除文件
    if (user.logo) {
      const logoPath = path.join(__dirname, '..', user.logo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }

      // 更新用户logo字段为null
      await User.update({ logo: null }, { where: { id: req.user.id } });

      res.json({ message: 'Logo deleted successfully' });
    } else {
      res.status(404).json({ message: 'No logo found for this user' });
    }
  } catch (error) {
    console.error('Logo deletion error:', error);
    res.status(500).json({ message: 'Server error during logo deletion' });
  }
});

module.exports = router;