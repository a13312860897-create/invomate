import { useState, useCallback } from 'react';

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = ++toastId;
    const toast = {
      id,
      message,
      type,
      duration: options.duration || 5000,
      position: options.position || 'top-right',
      showProgress: options.showProgress !== false,
      ...options
    };

    setToasts(prev => [...prev, toast]);

    // 自动移除toast
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, [removeToast]);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // 便捷方法
  const success = useCallback((message, options) => {
    return addToast(message, 'success', options);
  }, [addToast]);

  const error = useCallback((message, options) => {
    return addToast(message, 'error', { duration: 7000, ...options });
  }, [addToast]);

  const warning = useCallback((message, options) => {
    return addToast(message, 'warning', options);
  }, [addToast]);

  const info = useCallback((message, options) => {
    return addToast(message, 'info', options);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  };
};

export default useToast;