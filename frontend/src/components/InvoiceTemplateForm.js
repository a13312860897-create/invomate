import React, { useState, useEffect } from 'react';
import './InvoiceTemplateForm.css';

const InvoiceTemplateForm = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
    fields: []
  });
  const [activeTab, setActiveTab] = useState('basic');
  const [showFieldEditor, setShowFieldEditor] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldForm, setFieldForm] = useState({
    name: '',
    label: '',
    fieldType: 'flexible', // 'fixed' or 'flexible'
    valueType: 'text',
    targetEntity: 'invoice',
    fixedValue: '',
    defaultValue: '',
    isRequired: false,
    options: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        isDefault: template.isDefault || false,
        fields: template.fields || []
      });
    }
  }, [template]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFieldFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFieldForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openFieldEditor = (field = null) => {
    if (field) {
      setEditingField(field);
      setFieldForm({
        name: field.name || '',
        label: field.label || '',
        fieldType: field.fieldType || 'flexible',
        valueType: field.valueType || 'text',
        targetEntity: field.targetEntity || 'invoice',
        fixedValue: field.fixedValue || '',
        defaultValue: field.defaultValue || '',
        isRequired: field.isRequired || false,
        options: field.options || []
      });
    } else {
      setEditingField(null);
      setFieldForm({
        name: '',
        label: '',
        fieldType: 'flexible',
        valueType: 'text',
        targetEntity: 'invoice',
        fixedValue: '',
        defaultValue: '',
        isRequired: false,
        options: []
      });
    }
    setShowFieldEditor(true);
  };

  const saveField = () => {
    if (!fieldForm.name || !fieldForm.label) {
      setError('Field name and display label cannot be empty');
      return;
    }

    const newField = {
      id: editingField ? editingField.id : Date.now(),
      ...fieldForm
    };

    setFormData(prev => ({
      ...prev,
      fields: editingField 
        ? prev.fields.map(f => f.id === editingField.id ? newField : f)
        : [...prev.fields, newField]
    }));

    setShowFieldEditor(false);
    setError('');
  };

  const deleteField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Template name cannot be empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave(formData);
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const fieldTypeOptions = [
    { value: 'flexible', label: 'Flexible Value - Editable' },
    { value: 'fixed', label: 'Fixed Value - Non-editable' }
  ];

  const valueTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select Box' },
    { value: 'textarea', label: 'Multi-line Text' }
  ];

  const targetEntityOptions = [
    { value: 'invoice', label: 'Invoice Information' },
    { value: 'client', label: 'Client Information' },
    { value: 'item', label: 'Item Information' }
  ];

  return (
    <div className="invoice-template-form">
      <div className="form-header">
        <h2>{template ? 'Edit Template' : 'Create New Template'}</h2>
        <button type="button" onClick={onCancel} className="btn-close">
          ✕
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-tabs">
        <button 
          className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          Basic Information
        </button>
        <button 
          className={`tab ${activeTab === 'fields' ? 'active' : ''}`}
          onClick={() => setActiveTab('fields')}
        >
          Field Configuration
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {activeTab === 'basic' && (
          <div className="tab-content">
            <div className="form-group">
              <label htmlFor="name">Template Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Standard Invoice Template"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Template Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the purpose and features of this template"
                rows="3"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                />
                Set as Default Template
              </label>
              <small>The default template will be automatically applied to newly created invoices</small>
            </div>
          </div>
        )}

        {activeTab === 'fields' && (
          <div className="tab-content">
            <div className="fields-header">
              <h3>Field Configuration</h3>
              <button 
                type="button" 
                onClick={() => openFieldEditor()}
                className="btn-add-field"
              >
                + Add Field
              </button>
            </div>

            <div className="fields-list">
              {formData.fields.map(field => (
                <div key={field.id} className="field-item">
                  <div className="field-info">
                    <div className="field-name">{field.label}</div>
                    <div className="field-details">
                      <span className={`field-type ${field.fieldType}`}>
                        {field.fieldType === 'fixed' ? 'Fixed Value' : 'Flexible Value'}
                      </span>
                      <span className="field-value-type">{field.valueType}</span>
                      <span className="field-entity">{field.targetEntity}</span>
                    </div>
                  </div>
                  <div className="field-actions">
                    <button 
                      type="button" 
                      onClick={() => openFieldEditor(field)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      onClick={() => deleteField(field.id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {formData.fields.length === 0 && (
                <div className="empty-fields">
                  No fields yet, click "Add Field" to start configuration
                </div>
              )}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-cancel">
            Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-save">
          {loading ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </form>

      {showFieldEditor && (
        <div className="field-editor-overlay">
          <div className="field-editor">
            <div className="field-editor-header">
              <h3>{editingField ? 'Edit Field' : 'Add Field'}</h3>
              <button 
                type="button" 
                onClick={() => setShowFieldEditor(false)}
                className="btn-close"
              >
                ✕
              </button>
            </div>

            <div className="field-editor-content">
              <div className="form-group">
                <label htmlFor="fieldName">Field Name *</label>
                <input
                  type="text"
                  id="fieldName"
                  name="name"
                  value={fieldForm.name}
                  onChange={handleFieldFormChange}
                  placeholder="e.g., company_name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fieldLabel">Display Label *</label>
                <input
                  type="text"
                  id="fieldLabel"
                  name="label"
                  value={fieldForm.label}
                  onChange={handleFieldFormChange}
                  placeholder="e.g., Company Name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fieldType">Field Type</label>
                <select
                  id="fieldType"
                  name="fieldType"
                  value={fieldForm.fieldType}
                  onChange={handleFieldFormChange}
                >
                  {fieldTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="valueType">Value Type</label>
                <select
                  id="valueType"
                  name="valueType"
                  value={fieldForm.valueType}
                  onChange={handleFieldFormChange}
                >
                  {valueTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="targetEntity">Target Entity</label>
                <select
                  id="targetEntity"
                  name="targetEntity"
                  value={fieldForm.targetEntity}
                  onChange={handleFieldFormChange}
                >
                  {targetEntityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {fieldForm.fieldType === 'fixed' ? (
                <div className="form-group">
                  <label htmlFor="fixedValue">Fixed Value</label>
                  <input
                    type="text"
                    id="fixedValue"
                    name="fixedValue"
                    value={fieldForm.fixedValue}
                    onChange={handleFieldFormChange}
                    placeholder="Enter fixed value"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="defaultValue">Default Value</label>
                  <input
                    type="text"
                    id="defaultValue"
                    name="defaultValue"
                    value={fieldForm.defaultValue}
                    onChange={handleFieldFormChange}
                    placeholder="Enter default value (optional)"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isRequired"
                    checked={fieldForm.isRequired}
                    onChange={handleFieldFormChange}
                  />
                  Required Field
                </label>
              </div>
            </div>

            <div className="field-editor-actions">
              <button 
                type="button" 
                onClick={() => setShowFieldEditor(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={saveField}
                className="btn-primary"
              >
                Save Field
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceTemplateForm;