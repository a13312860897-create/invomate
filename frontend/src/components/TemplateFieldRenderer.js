import React from 'react';
import { FiLock } from 'react-icons/fi';

const TemplateFieldRenderer = ({ 
  field, 
  value, 
  onChange, 
  disabled = false,
  className = '' 
}) => {
  const { 
    name, 
    label, 
    fieldType, 
    valueType, 
    fixedValue, 
    defaultValue, 
    isRequired, 
    options = [] 
  } = field;

  // If it's a fixed value field, display as read-only
  const isReadOnly = valueType === 'fixed' || disabled;
  const displayValue = valueType === 'fixed' ? fixedValue : value;

  const handleChange = (e) => {
    if (isReadOnly) return;
    
    const newValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange(name, newValue);
  };

  const renderField = () => {
    switch (fieldType) {
      case 'text':
        return (
          <input
            type="text"
            id={name}
            name={name}
            value={displayValue || ''}
            onChange={handleChange}
            readOnly={isReadOnly}
            required={isRequired}
            placeholder={valueType === 'flexible' ? defaultValue : ''}
            className={`form-input ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            id={name}
            name={name}
            value={displayValue || ''}
            onChange={handleChange}
            readOnly={isReadOnly}
            required={isRequired}
            placeholder={valueType === 'flexible' ? defaultValue : ''}
            className={`form-input ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            id={name}
            name={name}
            value={displayValue || ''}
            onChange={handleChange}
            readOnly={isReadOnly}
            required={isRequired}
            placeholder={valueType === 'flexible' ? defaultValue : ''}
            className={`form-input ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
          />
        );

      case 'tel':
        return (
          <input
            type="tel"
            id={name}
            name={name}
            value={displayValue || ''}
            onChange={handleChange}
            readOnly={isReadOnly}
            required={isRequired}
            placeholder={valueType === 'flexible' ? defaultValue : ''}
            className={`form-input ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            id={name}
            name={name}
            value={displayValue || ''}
            onChange={handleChange}
            readOnly={isReadOnly}
            required={isRequired}
            className={`form-input ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={displayValue || ''}
            onChange={handleChange}
            readOnly={isReadOnly}
            required={isRequired}
            placeholder={valueType === 'flexible' ? defaultValue : ''}
            rows="3"
            className={`form-textarea ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
          />
        );

      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={displayValue || ''}
            onChange={handleChange}
            disabled={isReadOnly}
            required={isRequired}
            className={`form-select ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
          >
            <option value="">Please select...</option>
            {options.map((option, index) => (
              <option key={index} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={name}
              name={name}
              checked={displayValue === true || displayValue === 'true'}
              onChange={handleChange}
              disabled={isReadOnly}
              className={`form-checkbox ${isReadOnly ? 'cursor-not-allowed' : ''}`}
            />
            <label htmlFor={name} className="ml-2 text-sm text-gray-700">
              {label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  id={`${name}_${index}`}
                  name={name}
                  value={option.value || option}
                  checked={displayValue === (option.value || option)}
                  onChange={handleChange}
                  disabled={isReadOnly}
                  className={`form-radio ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                />
                <label htmlFor={`${name}_${index}`} className="ml-2 text-sm text-gray-700">
                  {option.label || option}
                </label>
              </div>
            ))}
          </div>
        );

      default:
        return (
          <input
            type="text"
            id={name}
            name={name}
            value={displayValue || ''}
            onChange={handleChange}
            readOnly={isReadOnly}
            required={isRequired}
            placeholder={valueType === 'flexible' ? defaultValue : ''}
            className={`form-input ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
          />
        );
    }
  };

  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label flex items-center">
        {label || name}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
        {isReadOnly && <FiLock className="ml-2 h-4 w-4 text-gray-400" title="Fixed value field" />}
      </label>
      {renderField()}
      {valueType === 'fixed' && (
        <small className="text-gray-500 text-xs mt-1">
          This field is a fixed value, preset by the template
        </small>
      )}
    </div>
  );
};

export default TemplateFieldRenderer;