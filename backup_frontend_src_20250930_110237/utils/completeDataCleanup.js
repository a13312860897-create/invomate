// 完整的数据清理脚本
const completeDataCleanup = () => {
  console.log('=== 开始完整数据清理 ===');
  
  // 1. 清除所有localStorage数据
  console.log('清除localStorage数据...');
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    keysToRemove.push(localStorage.key(i));
  }
  
  keysToRemove.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`检查项目: ${key} = ${value}`);
    
    // 清除包含测试数据的项目
    if (value && (
      value.includes('测试公司') ||
      value.includes('Invomate SAS') ||
      value.includes('123 Rue de Paris') ||
      value.includes('FR32123456789') ||
      value.includes('test') ||
      value.includes('Test') ||
      key.includes('test') ||
      key.includes('Test') ||
      key.includes('测试')
    )) {
      console.log(`移除测试数据: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // 2. 强制清除特定的localStorage项目
  const specificKeys = [
    'user',
    'token', 
    'frenchCompanySettings',
    'companySettings',
    'userSettings'
  ];
  
  specificKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`强制清除: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // 3. 清除sessionStorage
  console.log('清除sessionStorage数据...');
  sessionStorage.clear();
  
  console.log('=== 数据清理完成 ===');
  
  // 4. 提示用户重新登录
  alert('数据已清理完成，请重新登录以获取最新数据');
  
  // 5. 跳转到登录页面
  window.location.href = '/login';
};

// 导出函数
export default completeDataCleanup;

// 如果在浏览器控制台中运行
if (typeof window !== 'undefined') {
  window.completeDataCleanup = completeDataCleanup;
  console.log('已添加 completeDataCleanup 函数到 window 对象');
  console.log('在控制台运行: completeDataCleanup()');
}