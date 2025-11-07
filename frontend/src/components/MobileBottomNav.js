import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiFileText, FiUsers, FiSettings, FiPlus } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const MobileBottomNav = () => {
  const location = useLocation();
  const { t } = useTranslation(['navigation', 'routes']);

  const navItems = [
    {
      name: t('navigation:dashboard'),
      href: `/${t('routes:dashboard')}`,
      icon: FiHome
    },
    {
      name: t('navigation:invoices'),
      href: `/${t('routes:invoices')}`,
      icon: FiFileText
    },
    {
      name: t('navigation:create'),
      href: `/${t('routes:invoices')}/${t('routes:new')}`,
      icon: FiPlus,
      isCreate: true
    },
    {
      name: t('navigation:clients'),
      href: `/${t('routes:clients')}`,
      icon: FiUsers
    },
    {
      name: t('navigation:settings'),
      href: `/${t('routes:settings')}`,
      icon: FiSettings
    }
  ];

  const isActive = (href) => {
    if (href === `/${t('routes:dashboard')}`) {
      return location.pathname === href || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="mobile-nav safe-area-inset-bottom md:hidden">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`mobile-nav-item ${
                active ? 'active' : ''
              } ${
                item.isCreate ? 'relative' : ''
              }`}
            >
              {item.isCreate ? (
                <div className="bg-primary-600 text-white rounded-full p-2 -mt-2 shadow-lg">
                  <Icon className="mobile-nav-icon" />
                </div>
              ) : (
                <Icon className="mobile-nav-icon" />
              )}
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;