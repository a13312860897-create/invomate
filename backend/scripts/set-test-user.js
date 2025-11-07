// 开发环境脚本：创建或设置测试账号密码
// 目标账号：a13312860897@163.com，密码：Ddtb959322

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8080/api';

async function ensureTestUser() {
  const email = 'a13312860897@163.com';
  const password = 'Ddtb959322';
  const payload = {
    email,
    password,
    firstName: '测试',
    lastName: '账号',
    companyName: 'Test Co',
    phone: '+33 1 42 86 83 00',
    address: '123 Avenue des Entrepreneurs',
    city: 'Paris',
    postalCode: '75001',
    country: 'France'
  };

  try {
    console.log('➡️ 尝试注册测试账号:', email);
    const res = await axios.post(`${API_BASE_URL}/auth/register`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.data?.success) {
      console.log('✅ 注册成功');
    } else {
      console.log('⚠️ 注册返回非成功：', res.data);
    }
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    if (err.response?.status === 409) {
      console.log('ℹ️ 账号已存在，尝试使用新密码登录以确认密码：');
    } else {
      console.log('❌ 注册失败：', msg);
    }
  }

  // 无论注册成功与否，都尝试使用新密码登录验证
  try {
    console.log('➡️ 尝试登录验证新密码...');
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    if (loginRes.data?.success) {
      const token = loginRes.data?.data?.token || loginRes.data?.token;
      console.log('✅ 登录成功，密码已可用');
      console.log('用户ID:', loginRes.data?.data?.user?.id || loginRes.data?.user?.id);
      console.log('Token(前端使用):', token ? token.substring(0, 24) + '...' : '无');
    } else {
      console.log('⚠️ 登录返回非成功：', loginRes.data);
    }
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.log('❌ 登录失败：', msg);
    console.log('➡️ 如果账号已存在且旧密码未知，建议通过重置密码流程：/api/auth/request-password-reset');
  }
}

ensureTestUser().catch(e => {
  console.error('脚本执行异常：', e);
  process.exit(1);
});