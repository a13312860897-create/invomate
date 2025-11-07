const axios = require('axios');

console.log('=== 环境检查 ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('是否为生产环境:', process.env.NODE_ENV === 'production');
console.log('是否为非生产环境:', process.env.NODE_ENV !== 'production');

// 测试通知API
async function testNotifications() {
  try {
    console.log('\n=== 测试通知API ===');
    
    // 首先登录获取token
    const loginResponse = await axios.post('http://localhost:8080/api/auth/login', {
      email: 'a133128860897@163.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('登录成功，获取到token');
    
    // 调用通知API
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