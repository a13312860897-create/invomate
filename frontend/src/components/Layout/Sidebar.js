import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiFileText, FiUsers, FiPlus, FiChevronDown, FiChevronRight, FiDollarSign, FiFile, FiTrendingUp, FiPieChart, FiLink, FiSettings, FiMail } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import SubscriptionStatusBar from './SubscriptionStatusBar';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const [invoicesOpen, setInvoicesOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { t } = useTranslation(['navigation', 'common', 'routes']);
  
  const navigation = [
    { 
      name: t('navigation:dashboard'), 
      href: `/${t('routes:dashboard')}`, 
      icon: FiTrendingUp
    },
    {
      name: t('navigation:invoicesSection'),
      icon: FiFileText,
      children: [
        { name: t('common:all'), href: `/${t('routes:invoices')}` },
        { name: t('common:create'), href: `/${t('routes:invoices')}/${t('routes:new')}` },
      ],
    },
    { name: t('navigation:clients'), href: `/${t('routes:clients')}`, icon: FiUsers },
    { 
      name: t('navigation:reports'), 
      href: `/${t('routes:reports')}`, 
      icon: FiPieChart
    },
    // { 
    //   name: t('navigation:integrations'), 
    //   href: `/${t('routes:integrations')}`, 
    //   icon: FiLink
    // },

    {
      name: t('navigation:pricing'),
      icon: FiDollarSign,
      href: `/${t('routes:pricing')}`,
    },
    {
      name: t('navigation:settings'),
      icon: FiSettings,
      children: [
        { name: 'Subscription', href: '/subscription' },
        { name: t('navigation:settings'), href: `/${t('routes:settings')}` },
      ],
    },
    {
      name: t('navigation:legal'),
      icon: FiFile,
      children: [
        { name: t('navigation:terms'), href: `/${t('routes:terms')}` },
        { name: t('navigation:privacy'), href: `/${t('routes:privacy')}` },
      ],
    },
  ];
  
  const isActive = (href) => {
    return location.pathname === href;
  };
  
  const isParentActive = (children) => {
    return children.some(child => location.pathname.startsWith(child.href));
  };
  
  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className="flex flex-col h-full pt-5 pb-4 overflow-y-auto">
        {/* Logo and Subscription Badge */}
        <div className="flex flex-col items-start flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
              <FiFileText className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">{t('common:app.name')}</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="mt-8 flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => {
                      if (item.name === t('navigation:invoicesSection')) {
              setInvoicesOpen(!invoicesOpen);
            } else if (item.name === t('navigation:legal')) {
              setLegalOpen(!legalOpen);
            } else if (item.name === t('navigation:settings')) {
              setSettingsOpen(!settingsOpen);
            }
                    }}
                    className={`w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isParentActive(item.children) ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                    {item.name}
                    {(item.name === t('navigation:invoicesSection') && invoicesOpen) || (item.name === t('navigation:legal') && legalOpen) || (item.name === t('navigation:settings') && settingsOpen) ? (
                      <FiChevronDown className="ml-auto h-4 w-4 text-gray-400" />
                    ) : (
                      <FiChevronRight className="ml-auto h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  
                  {(item.name === t('navigation:invoicesSection') && invoicesOpen) && (
                    <div className="pl-10 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive(child.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                  
                  {(item.name === t('navigation:settings') && settingsOpen) && (
                    <div className="pl-10 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive(child.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                  
                  {(item.name === t('navigation:legal') && legalOpen) && (
                    <div className="pl-10 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive(child.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to={item.href}
                  className={`group flex flex-col px-2 py-2 text-sm font-medium rounded-md ${isActive(item.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center w-full">
                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                    {item.name}
                  </div>
                  {item.description && (
                    <div className="text-xs text-gray-500 mt-1 ml-8">
                      {item.description}
                    </div>
                  )}
                </Link>
              )}
            </div>
          ))}
        </nav>
        
        {/* Quick actions */}
        <div className="px-4 mt-auto pt-4 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {t('navigation:sidebar.quickActions')}
          </div>
          <div className="space-y-2">
            <Link
              to={`/${t('routes:invoices')}/${t('routes:new')}`}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary-50 text-primary-700 hover:bg-primary-100"
              onClick={() => setSidebarOpen(false)}
            >
              <FiPlus className="mr-2 h-4 w-4" />
              {t('navigation:sidebar.createInvoice')}
            </Link>
            <Link
              to={`/${t('routes:clients')}`}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <FiUsers className="mr-2 h-4 w-4" />
              {t('navigation:sidebar.createClient')}
            </Link>
          </div>
        </div>
        
        {/* Subscription Status Bar */}
        <SubscriptionStatusBar />
      </div>
    </div>
  );
};

export default Sidebar;