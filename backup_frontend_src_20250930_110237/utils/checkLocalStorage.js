// 检查和清除localStorage中的用户数据
const checkAndClearUserData = () => {
  console.log('=== 检查localStorage中的数据 ===');
  
  // 检查所有localStorage项目
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value);
    
    // 检查是否包含"测试公司"或"test"
    if (value && (value.includes('测试公司') || value.includes('test') || value.includes('Test'))) {
      console.log(`发现包含测试数据的项目: ${key}`);
    }
  }
  
  // 清除用户相关数据
  console.log('\n=== 清除用户数据 ===');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  
  // 清除其他可能的测试数据
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('test') || key.includes('Test') || key.includes('测试'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    console.log(`移除测试数据: ${key}`);
    localStorage.removeItem(key);
  });
  
  console.log('localStorage清理完成');
  
  // 刷新页面
  window.location.reload();
};

// 如果直接在浏览器控制台运行
if (typeof window !== 'undefined') {
  window.checkAndClearUserData = checkAndClearUserData;
  console.log('已添加 checkAndClearUserData 函数到 window 对象');
  console.log('在控制台运行: checkAndClearUserData()');
}

export default checkAndClearUserData;