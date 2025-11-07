import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiAlertTriangle, FiClock } from 'react-icons/fi';

const ExpiryNotification = () => {
  const { user } = useAuth();
  const [hasShownNotification, setHasShownNotification] = useState(false);

  useEffect(() => {
    if (!user?.subscriptionEndDate || hasShownNotification) return;

    const checkExpiry = () => {
      const now = new Date().getTime();
      const end = new Date(user.subscriptionEndDate).getTime();
      const difference = end - now;
      
      // 计算剩余天数
      const daysLeft = Math.ceil(difference / (1000 * 60 * 60 * 24));
      
      // 如果剩余天数在3天以内且大于0，显示提醒
      if (daysLeft > 0 && daysLeft <= 3) {
        // 检查今天是否已经显示过通知
        const today = new Date().toDateString();
        const lastNotificationDate = localStorage.getItem('lastExpiryNotification');
        
        if (lastNotificationDate !== today) {
          // 显示提醒通知
          toast.warning(
            <div className="flex items-center">
              <FiClock className="mr-2 h-5 w-5" />
              <div>
                <div className="font-medium">Trial ending soon</div>
                <div className="text-sm">
                  You have {daysLeft} days remaining. Please renew.
                </div>
              </div>
            </div>,
            {
              position: "top-center",
              autoClose: 8000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );
          
          // 记录今天已显示过通知
          localStorage.setItem('lastExpiryNotification', today);
          setHasShownNotification(true);
        }
      } else if (daysLeft <= 0) {
        // 已过期的情况
        const lastNotificationDate = localStorage.getItem('lastExpiryNotification');
        const today = new Date().toDateString();
        
        if (lastNotificationDate !== today) {
          toast.error(
            <div className="flex items-center">
              <FiAlertTriangle className="mr-2 h-5 w-5" />
              <div>
                <div className="font-medium">Trial has expired</div>
                <div className="text-sm">
                  Please renew to continue using all features
                </div>
              </div>
            </div>,
            {
              position: "top-center",
              autoClose: 10000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            }
          );
          
          localStorage.setItem('lastExpiryNotification', today);
          setHasShownNotification(true);
        }
      }
    };

    // 延迟1秒后检查，确保页面完全加载
    const timer = setTimeout(checkExpiry, 1000);

    return () => clearTimeout(timer);
  }, [user?.subscriptionEndDate, hasShownNotification]);

  // 这个组件不渲染任何UI，只负责显示通知
  return null;
};

export default ExpiryNotification;