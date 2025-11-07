const axios = require('axios');
const bcrypt = require('bcryptjs');

// 确保环境变量正确加载
require('dotenv').config();
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dev_secret_key_2024_for_testing_only_do_not_use_in_production';
}

async function testNotifications() {
  try {
    console.log('=== 测试通知API ===');
    
    // 检查内存数据库中的用户密码
    const memoryDb = require('./src/config/memoryDatabase');
    const user = memoryDb.users[0];
    console.log('用户邮箱:', user.email);
    
    // 尝试不同的密码
    const passwords = ['password123', '123456', 'admin', 'test123'];
    let token = null;
    
    for (const password of passwords) {
      try {
        console.log(`尝试密码: ${password}`);
        const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
          email: user.email,
          password: password
        });
        
        token = loginResponse.data.data.token;
        console.log('登录成功！');
        break;
      } catch (error) {
        console.log(`密码 ${password} 失败:`, error.response?.data?.message || error.message);
      }
    }
    
    if (!token) {
      console.log('所有密码都失败了，尝试直接验证哈希密码...');
      // 检查哈希密码是否匹配常见密码
      let correctPassword = null;
      for (const password of passwords) {
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`密码 ${password} 匹配哈希: ${isMatch}`);
        if (isMatch) {
          console.log(`找到正确密码: ${password}`);
          correctPassword = password;
          break;
        }
      }
      
      if (correctPassword) {
        // 使用正确密码重新登录
        try {
          const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
            email: user.email,
            password: correctPassword
          });
          token = loginResponse.data.data.token;
          console.log('使用正确密码登录成功！');
        } catch (error) {
          console.log('使用正确密码登录失败:', error.response?.data?.message || error.message);
          return;
        }
      } else {
        console.log('未找到正确密码');
        return;
      }
    }
    
    // 调用通知API
    console.log('\n=== 调用通知API ===');
    const notificationResponse = await axios.get('http://localhost:8080/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('通知API响应:');
    console.log('总通知数:', notificationResponse.data.total);
    console.log('未读通知数:', notificationResponse.data.unreadCount);
    console.log('通知列表:');
    notificationResponse.data.notifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. [${notification.type}] ${notification.message}`);
    });
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

testNotifications();