// 完整数据清理工具
const completeDataCleanup = async () => {
  try {
  
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
  
  // 2. 强制清除特定的localStorage项目（包含设置与测试相关键）
  const specificKeys = [
    'user',
    'token',
    'frenchCompanySettings',
    'companySettings',
    'userSettings',
    // 统一设置与表单草稿
    'unifiedSettings',
    'newInvoiceFormData',
    // 仿真/沙箱与调试
    'mockBillingHistory',
    'sandboxMode',
    'redirectAfterLogin',
    // 主题自动模式（不影响主题本身）
    'autoMode',
    // 用户侧缓存资料
    'userProfile',
    'userTimezone'
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
  
  
  return { success: true, message: '数据清理完成' };
  } catch (error) {
    console.error('数据清理失败:', error);
    return { success: false, error: error.message };
  }
};

// 导出函数
export default completeDataCleanup;

// 如果在浏览器控制台中运行
if (typeof window !== 'undefined') {
  window.completeDataCleanup = completeDataCleanup;
  console.log('已添加 completeDataCleanup 函数到 window 对象');
  console.log('在控制台运行: completeDataCleanup()');
}