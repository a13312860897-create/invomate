// 这个脚本需要在浏览器控制台中运行
// 用于检查前端的认证状态

console.log('=== 前端认证状态检查 ===');

// 检查localStorage中的token
const token = localStorage.getItem('token');
console.log('Token存在:', !!token);
if (token) {
  console.log('Token长度:', token.length);
  console.log('Token前20字符:', token.substring(0, 20));
  console.log('是否为开发模式token:', token === 'dev-mock-token');
}

// 检查其他相关的localStorage项
console.log('其他localStorage项:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.includes('auth') || key.includes('user') || key.includes('token')) {
    console.log(`  ${key}:`, localStorage.getItem(key));
  }
}

// 检查当前页面URL
console.log('当前页面URL:', window.location.href);
console.log('当前路径:', window.location.pathname);

// 检查是否在登录页面
const isOnLoginPage = window.location.pathname.includes('login');
console.log('是否在登录页面:', isOnLoginPage);

// 如果有token，尝试验证
if (token && token !== 'dev-mock-token') {
  console.log('尝试验证token...');
  
  fetch('/api/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('Token验证结果:', data);
  })
  .catch(error => {
    console.error('Token验证失败:', error);
  });
}

console.log('=== 检查完成 ===');