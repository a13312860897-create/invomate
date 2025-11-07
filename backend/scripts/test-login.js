// 简单登录测试脚本
const axios = require('axios');

(async () => {
  try {
    const res = await axios.post('http://127.0.0.1:8080/api/auth/login', {
      email: 'a13312860897@163.com',
      password: 'Ddtb959322'
    });
    console.log('登录结果:', res.data);
  } catch (e) {
    console.error('登录失败状态码:', e.response?.status);
    console.error('登录失败响应体:', e.response?.data);
    console.error('错误消息:', e.message);
    console.error('错误栈:', e.stack);
    process.exit(1);
  }
})();