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
      setError('字段名称和显示标签不能为空');
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
      setError('模板名称不能为空');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave(formData);
    } catch (err) {
      setError(err.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const fieldTypeOptions = [
    { value: 'flexible', label: '灵活值 - 可编辑' },
    { value: 'fixed', label: '固定值 - 不可编辑' }
  ];

  const valueTypeOptions = [
    { value: 'text', label: '文本' },
    { value: 'number', label: '数字' },
    { value: 'date', label: '日期' },
    { value: 'select', label: '选择框' },
    { value: 'textarea', label: '多行文本' }
  ];

  const targetEntityOptions = [
    { value: 'invoice', label: '发票信息' },
    { value: 'client', label: '客户信息' },
    { value: 'item', label: '项目信息' }
  ];

  return (
    <div className="invoice-template-form">
      <div className="form-header">
        <h2>{template ? '编辑模板' : '创建新模板'}</h2>
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
          基本信息
        </button>
        <button 
          className={`tab ${activeTab === 'fields' ? 'active' : ''}`}
          onClick={() => setActiveTab('fields')}
        >
          字段配置
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {activeTab === 'basic' && (
          <div className="tab-content">
            <div className="form-group">
              <label htmlFor="name">模板名称 *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="例如：标准发票模板"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">模板描述</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="描述此模板的用途和特点"
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
                设为默认模板
              </label>
              <small>默认模板将自动应用于新创建的发票</small>
            </div>
          </div>
        )}

        {activeTab === 'fields' && (
          <div className="tab-content">
            <div className="fields-header">
              <h3>字段配置</h3>
              <button 
                type="button" 
                onClick={() => openFieldEditor()}
                className="btn-add-field"
              >
                + 添加字段
              </button>
            </div>

            <div className="fields-list">
              {formData.fields.map(field => (
                <div key={field.id} className="field-item">
                  <div className="field-info">
                    <div className="field-name">{field.label}</div>
                    <div className="field-details">
                      <span className={`field-type ${field.fieldType}`}>
                        {field.fieldType === 'fixed' ? '固定值' : '灵活值'}
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
                      编辑
                    </button>
                    <button 
                      type="button" 
                      onClick={() => deleteField(field.id)}
                      className="btn-delete"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
              {formData.fields.length === 0 && (
                <div className="empty-fields">
                  暂无字段，点击"添加字段"开始配置
                </div>
              )}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn-cancel">
            取消
          </button>
          <button type="submit" disabled={loading} className="btn-save">
            {loading ? '保存中...' : '保存模板'}
          </button>
        </div>
      </form>

      {showFieldEditor && (
        <div className="field-editor-overlay">
          <div className="field-editor">
            <div className="field-editor-header">
              <h3>{editingField ? '编辑字段' : '添加字段'}</h3>
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
                <label htmlFor="fieldName">字段名称 *</label>
                <input
                  type="text"
                  id="fieldName"
                  name="name"
                  value={fieldForm.name}
                  onChange={handleFieldFormChange}
                  placeholder="例如：company_name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fieldLabel">显示标签 *</label>
                <input
                  type="text"
                  id="fieldLabel"
                  name="label"
                  value={fieldForm.label}
                  onChange={handleFieldFormChange}
                  placeholder="例如：公司名称"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fieldType">字段类型</label>
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
                <label htmlFor="valueType">值类型</label>
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
                <label htmlFor="targetEntity">目标实体</label>
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
                  <label htmlFor="fixedValue">固定值</label>
                  <input
                    type="text"
                    id="fixedValue"
                    name="fixedValue"
                    value={fieldForm.fixedValue}
                    onChange={handleFieldFormChange}
                    placeholder="输入固定值"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="defaultValue">默认值</label>
                  <input
                    type="text"
                    id="defaultValue"
                    name="defaultValue"
                    value={fieldForm.defaultValue}
                    onChange={handleFieldFormChange}
                    placeholder="输入默认值（可选）"
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
                  必填字段
                </label>
              </div>
            </div>

            <div className="field-editor-actions">
              <button 
                type="button" 
                onClick={() => setShowFieldEditor(false)}
                className="btn-cancel"
              >
                取消
              </button>
              <button 
                type="button" 
                onClick={saveField}
                className="btn-save"
              >
                保存字段
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceTemplateForm;