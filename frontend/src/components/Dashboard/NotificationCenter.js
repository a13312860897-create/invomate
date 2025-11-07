import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiInfo, FiCheckCircle, FiBell, FiClock, FiTrash2, FiFileText } from 'react-icons/fi';

const NotificationCenter = ({ notifications = [], onDismiss, onDelete, onViewAll }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-orange-500" />;
      case 'error':
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      case 'success':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <FiInfo className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationBg = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleDeleteClick = (notificationId) => {
    setDeleteConfirm(notificationId);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm && onDelete) {
      onDelete(deleteConfirm);
    }
    setDeleteConfirm(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleViewOverdueInvoices = () => {
    // 跳转到发票页面并筛选逾期发票
    navigate('/invoices?status=overdue');
  };

  if (!notifications.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FiBell className="w-5 h-5" />
            Notifications
          </h3>
        </div>
        <div className="text-center py-8">
          <FiBell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No notifications at the moment</p>
          <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
        </div>
      </div>
    );
  }

  const displayNotifications = isExpanded ? notifications : notifications.slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FiBell className="w-5 h-5" />
          Notifications
          {notifications.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
              {notifications.length}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleViewOverdueInvoices}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md transition-colors"
            title="View Overdue Invoices"
          >
            <FiFileText className="w-4 h-4 mr-1" />
            Overdue Invoices
          </button>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {displayNotifications.map((notification, index) => (
          <div
            key={notification.id || index}
            className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${getNotificationBg(notification.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {notification.title && (
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {notification.title}
                      </h4>
                    )}
                    <p className="text-sm text-gray-700">
                      {notification.message}
                    </p>
                    {notification.count && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {notification.count} items
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    {notification.timestamp && (
                      <div className="flex items-center text-xs text-gray-500">
                        <FiClock className="w-3 h-3 mr-1" />
                        {formatTime(notification.timestamp)}
                      </div>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => handleDeleteClick(notification.id || index)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notifications.length > 3 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {isExpanded ? 'Show Less' : `Show ${notifications.length - 3} More`}
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="flex items-center mb-4">
              <FiAlertCircle className="w-6 h-6 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this notification? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;