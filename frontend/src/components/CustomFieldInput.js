import React from 'react';

const CustomFieldInput = ({ field, value, onChange }) => {
  const handleChange = (e) => {
    const newValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange(newValue);
  };

  const renderInput = () => {
    switch (field.valueType || field.fieldType) {
      case 'number':
        return (
          <input
            type="number"
            id={field.id}
            value={value || ''}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder={field.placeholder}
            required={field.isRequired}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            id={field.id}
            value={value || ''}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            required={field.isRequired}
          />
        );
      
      case 'select':
        const options = field.options ? JSON.parse(field.options) : [];
        return (
          <select
            id={field.id}
            value={value || ''}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            required={field.isRequired}
          >
            <option value="">请选择...</option>
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
              id={field.id}
              checked={value || false}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor={field.id} className="ml-2 block text-sm text-gray-900">
              {field.fieldLabel || field.label}
            </label>
          </div>
        );
      
      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={value || ''}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder={field.placeholder}
            required={field.isRequired}
          />
        );
      
      default:
        return (
          <input
            type="text"
            id={field.id}
            value={value || ''}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder={field.placeholder}
            required={field.isRequired}
          />
        );
    }
  };

  // 如果是checkbox类型，不需要额外的label
  if (field.valueType === 'checkbox' || field.fieldType === 'checkbox') {
    return (
      <div className="form-group">
        {renderInput()}
      </div>
    );
  }

  return (
    <div className="form-group">
      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
        {field.fieldLabel || field.label}
        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
    </div>
  );
};

export default CustomFieldInput;