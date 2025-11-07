import React, { useState } from 'react';

const InvoiceTemplateSelector = ({ onTemplateSelect }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const templates = [
    {
      id: 'french-standard',
      name: 'French Standard (TVA)',
      description: 'For domestic French clients, tax rate 20%',
      color: 'blue',
      changes: ['Tax rate: 20%', 'Show TVA information', 'French legal statements']
    },
    {
      id: 'french-exempt',
      name: 'French Exempt (TVA exemption)',
      description: 'For micro businesses, tax rate 0%',
      color: 'green',
      changes: ['Tax rate: 0%', 'Show TVA exemption terms', 'French legal statements']
    },
    {
      id: 'french-auto',
      name: 'French Reverse Charge (Auto-liquidation)',
      description: 'For EU B2B transactions; customer calculates TVA',
      color: 'purple',
      changes: ['Tax rate: 0%', 'Show reverse charge information', 'French legal statements']
    }
  ];

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    onTemplateSelect(templateId);
  };

  const getColorClasses = (color, isSelected) => {
    const baseClasses = "p-3 border rounded-lg cursor-pointer transition-all duration-200";
    const colorMap = {
      blue: isSelected 
        ? "border-blue-300 bg-gray-50" 
        : "border-gray-200 hover:border-gray-300",
      green: isSelected 
        ? "border-green-300 bg-gray-50" 
        : "border-gray-200 hover:border-gray-300",
      purple: isSelected 
        ? "border-purple-300 bg-gray-50" 
        : "border-gray-200 hover:border-gray-300"
    };
    return `${baseClasses} ${colorMap[color]}`;
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Choose invoice template</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => handleTemplateSelect(template.id)}
            className={getColorClasses(template.color, selectedTemplate === template.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 text-sm">{template.name}</h4>
              {selectedTemplate === template.id && (
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-2">{template.description}</p>
            
              {/* Changes shown in preview */}
              <div className="text-xs">
                <div className="text-gray-500 mb-1">Preview will show:</div>
                <ul className="space-y-1">
                  {template.changes.map((change, index) => (
                    <li key={index} className="flex items-center text-gray-600">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
        💡 <strong>Tip:</strong> After selecting different templates, check the changes in the right preview area
      </div>
    </div>
  );
};

export default InvoiceTemplateSelector;