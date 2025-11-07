import React, { useState, useEffect } from 'react';
import { 
  FiHome, 
  FiFileText, 
  FiUsers, 
  FiSettings, 
  FiMenu, 
  FiX, 
  FiChevronLeft,
  FiBell,
  FiSearch,
  FiPlus
} from 'react-icons/fi';

const MobileLayout = ({ 
  children, 
  currentPage = 'dashboard',
  onNavigate,
  notifications = [],
  showBackButton = false,
  onBack,
  title,
  actions = []
}) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // 监听滚动事件，调整头部样式
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 导航菜单项
  const navigationItems = [
    { id: 'dashboard', label: '仪表板', icon: FiHome, path: '/dashboard' },
    { id: 'invoices', label: '发票管理', icon: FiFileText, path: '/invoices' },
    { id: 'clients', label: '客户管理', icon: FiUsers, path: '/clients' },
    { id: 'settings', label: '设置', icon: FiSettings, path: '/settings' }
  ];

  const handleNavigation = (item) => {
    onNavigate(item.id, item.path);
    setShowSidebar(false);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
  };

  // 移动端头部
  const MobileHeader = () => (
    <header className={`
      fixed top-0 left-0 right-0 z-40 bg-white transition-all duration-200
      ${isScrolled ? 'shadow-md border-b border-gray-200' : 'border-b border-gray-100'}
    `}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* 左侧：菜单按钮或返回按钮 */}
        <div className="flex items-center">
          {showBackButton ? (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <FiMenu className="w-6 h-6" />
            </button>
          )}
          
          {title && (
            <h1 className="ml-2 text-lg font-semibold text-gray-900 truncate">
              {title}
            </h1>
          )}
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center space-x-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`p-2 rounded-lg ${
                action.primary 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title={action.label}
            >
              <action.icon className="w-5 h-5" />
            </button>
          ))}
          
          {/* 通知按钮 */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <FiBell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );

  // 移动端侧边栏
  const MobileSidebar = () => (
    <>
      {/* 遮罩层 */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={closeSidebar}
        />
      )}
      
      {/* 侧边栏 */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FiFileText className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900">发票系统</span>
          </div>
          <button
            onClick={closeSidebar}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item)}
                  className={`
                    w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors duration-200
                    ${currentPage === item.id 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${
                    currentPage === item.id ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 侧边栏底部 */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">U</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">用户名</p>
              <p className="text-xs text-gray-500">user@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // 移动端底部导航
  const MobileBottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="flex">
        {navigationItems.slice(0, 4).map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item)}
            className={`
              flex-1 flex flex-col items-center py-2 px-1 transition-colors duration-200
              ${currentPage === item.id 
                ? 'text-blue-600' 
                : 'text-gray-400 hover:text-gray-600'
              }
            `}
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );

  // 浮动操作按钮
  const FloatingActionButton = () => (
    <button
      onClick={() => onNavigate('create-invoice')}
      className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 z-30 flex items-center justify-center"
    >
      <FiPlus className="w-6 h-6" />
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 移动端头部 */}
      <MobileHeader />
      
      {/* 移动端侧边栏 */}
      <MobileSidebar />
      
      {/* 主要内容区域 */}
      <main className="pt-16 pb-20 px-4">
        <div className="max-w-lg mx-auto">
          {children}
        </div>
      </main>
      
      {/* 移动端底部导航 */}
      <MobileBottomNav />
      
      {/* 浮动操作按钮 */}
      <FloatingActionButton />
    </div>
  );
};

export default MobileLayout;