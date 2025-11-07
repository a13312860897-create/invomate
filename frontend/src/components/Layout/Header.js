import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiFileText, FiSettings, FiLogOut, FiChevronDown, FiUser, FiSun, FiMoon, FiShare2, FiPlus } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import TrialCountdown from '../TrialCountdown';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { t } = useTranslation(['navigation', 'common', 'routes']);
  
  const handleLogout = () => {
    logout();
    toast.success(t('common:logoutSuccess'));
    navigate(`/${t('routes:login')}`);
  };
  
  const getUserInitials = () => {
    if (!user) return '';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm fixed top-0 left-0 right-0 z-40 lg:left-64">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Mobile menu button */}
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              {sidebarOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center lg:hidden">
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <FiFileText className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900">{t('app:name')}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 订阅状态显示 - 顶部栏中间显眼位置 */}
            <div className="flex items-center justify-center flex-1 px-2 md:px-4">
              <TrialCountdown size="small" />
            </div>
            
            <div className="flex items-center space-x-3">
              {/* 创建按钮 */}
              <div>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  onClick={() => navigate(`/${t('routes:invoices')}/${t('routes:new')}`)}
                  title="Create new invoice"
                >
                  <FiPlus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">{t('navigation:create')}</span>
                </button>
              </div>
              
              {/* 分享按钮 */}
               <div>
                 <button
                   type="button"
                   className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                   onClick={() => {
                     const shareUrl = `${window.location.origin}/register?ref=${user?.id || 'demo'}`;
                     navigator.clipboard.writeText(shareUrl).then(() => {
                       toast.success('Invitation link copied to clipboard!');
                     }).catch(() => {
                       // 降级方案：显示分享链接
                       const modal = document.createElement('div');
                       modal.innerHTML = `
                         <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                           <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                             <h3 class="text-lg font-semibold mb-4">Share Invitation Link</h3>
                             <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded border">
                               <code class="text-sm break-all">${shareUrl}</code>
                             </div>
                             <div class="mt-4 flex justify-end">
                               <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
                                 Close
                               </button>
                             </div>
                           </div>
                         </div>
                       `;
                       document.body.appendChild(modal);
                     });
                   }}
                   title="Share invitation link"
                 >
                   <FiShare2 className="h-4 w-4 mr-1" />
                   <span className="hidden sm:inline">Share</span>
                 </button>
               </div>
             </div>
            
            {/* Theme toggle button */}
            <div className="ml-3">
              <button
                type="button"
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                onClick={toggleTheme}
                title={theme === 'dark' ? t('common:switchToLight', 'Switch to light mode') : t('common:switchToDark', 'Switch to dark mode')}
              >
                {theme === 'dark' ? (
                  <FiSun className="h-5 w-5" />
                ) : (
                  <FiMoon className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {/* User dropdown */}
            <div className="ml-3 relative">
              <div>
                <button
                  type="button"
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-800 font-medium">{getUserInitials()}</span>
                  </div>
                  <FiChevronDown className="ml-1 h-4 w-4 text-gray-500" />
                </button>
              </div>
              
              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                  </div>

                  {/* 试用期倒计时显示 */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <TrialCountdown />
                  </div>
                  
                  <Link
                    to={`/${t('routes:settings')}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <FiSettings className="mr-3 h-4 w-4 text-gray-400" />
                      {t('navigation:settings')}
                    </div>
                  </Link>
                  
                  <div className="border-t border-gray-100"></div>
                  
                  <button
                    type="button"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={handleLogout}
                  >
                    <div className="flex items-center">
                      <FiLogOut className="mr-3 h-4 w-4 text-gray-400" />
                      {t('common:logout')}
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;