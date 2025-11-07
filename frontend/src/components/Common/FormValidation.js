import React from 'react';
import { FiAlertCircle, FiCheck } from 'react-icons/fi';

// 表单字段组件
export const FormField = ({ 
  label, 
  error, 
  success, 
  required = false, 
  children, 
  className = '',
  helpText = ''
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {children}
        
        {/* 成功图标 */}
        {success && !error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <FiCheck className="h-5 w-5 text-green-500" />
          </div>
        )}
        
        {/* 错误图标 */}
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>
      
      {/* 帮助文本 */}
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      
      {/* 错误信息 */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <FiAlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
      
      {/* 成功信息 */}
      {success && !error && (
        <p className="mt-1 text-sm text-green-600 flex items-center">
          <FiCheck className="h-4 w-4 mr-1" />
          {success}
        </p>
      )}
    </div>
  );
};

// 输入框组件
export const Input = ({ 
  error, 
  success, 
  className = '', 
  ...props 
}) => {
  const getInputClasses = () => {
    let classes = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ';
    
    if (error) {
      classes += 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500 ';
    } else if (success) {
      classes += 'border-green-300 text-green-900 placeholder-green-300 focus:ring-green-500 focus:border-green-500 ';
    } else {
      classes += 'border-gray-300 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 ';
    }
    
    return classes + className;
  };

  return (
    <input
      className={getInputClasses()}
      {...props}
    />
  );
};

// 文本域组件
export const Textarea = ({ 
  error, 
  success, 
  className = '', 
  rows = 3,
  ...props 
}) => {
  const getTextareaClasses = () => {
    let classes = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm ';
    
    if (error) {
      classes += 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500 ';
    } else if (success) {
      classes += 'border-green-300 text-green-900 placeholder-green-300 focus:ring-green-500 focus:border-green-500 ';
    } else {
      classes += 'border-gray-300 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 ';
    }
    
    return classes + className;
  };

  return (
    <textarea
      rows={rows}
      className={getTextareaClasses()}
      {...props}
    />
  );
};

// 选择框组件
export const Select = ({ 
  error, 
  success, 
  className = '', 
  children,
  ...props 
}) => {
  const getSelectClasses = () => {
    let classes = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm bg-white ';
    
    if (error) {
      classes += 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500 ';
    } else if (success) {
      classes += 'border-green-300 text-green-900 focus:ring-green-500 focus:border-green-500 ';
    } else {
      classes += 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 ';
    }
    
    return classes + className;
  };

  return (
    <select
      className={getSelectClasses()}
      {...props}
    >
      {children}
    </select>
  );
};

// 验证规则
export const validationRules = {
  required: (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return '此字段为必填项';
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return '请输入有效的邮箱地址';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return `至少需要 ${min} 个字符`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return `不能超过 ${max} 个字符`;
    }
    return null;
  },

  number: (value) => {
    if (!value) return null;
    if (isNaN(value)) {
      return '请输入有效的数字';
    }
    return null;
  },

  positiveNumber: (value) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return '请输入大于0的数字';
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(value)) {
      return '请输入有效的手机号码';
    }
    return null;
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return '请输入有效的URL地址';
    }
  }
};

// 表单验证Hook
export const useFormValidation = (initialValues = {}, rules = {}) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const validateField = (name, value) => {
    const fieldRules = rules[name];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) return error;
    }
    return null;
  };

  const validateAll = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(rules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(rules).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return isValid;
  };

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0
  };
};

export default FormField;