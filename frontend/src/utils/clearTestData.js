// 清除localStorage中的测试数据
export const clearTestData = () => {
  
  // 清除用户认证数据
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  console.log('已清除用户认证数据');
  
  // 清除法国公司设置
  localStorage.removeItem('frenchCompanySettings');
  console.log('已清除法国公司设置');
  
  // 清除其他可能包含测试数据的localStorage项目
  const keysToCheck = [];
  for (let i = 0; i < localStorage.length; i++) {
    keysToCheck.push(localStorage.key(i));
  }
  
  keysToCheck.forEach(key => {
    if (key && (key.includes('test') || key.includes('Test') || key.includes('测试'))) {
      console.log(`清除测试相关数据: ${key}`);
      localStorage.removeItem(key);
    }
    
    // 检查值是否包含测试数据
    const value = localStorage.getItem(key);
    if (value && (value.includes('测试公司') || value.includes('Invomate SAS') || value.includes('test') || value.includes('Test'))) {
      console.log(`清除包含测试内容的数据: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  
  return { success: true, message: '测试数据清除完成' };
};

// 如果直接运行此文件，执行清除操作
if (typeof window !== 'undefined') {
  clearTestData();
}