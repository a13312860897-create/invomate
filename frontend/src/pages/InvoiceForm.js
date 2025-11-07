import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiSave, FiDollarSign, FiCalendar } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import InvoicePreview from '../components/InvoicePreview';
import CustomFieldInput from '../components/CustomFieldInput';
import FeatureGate from '../components/FeatureGate';
import { useSubscriptionFeatures } from '../hooks/useSubscriptionFeatures';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, api } = useAuth();
  const { t } = useTranslation();
  const isEditing = Boolean(id);
  
  // 订阅功能权限
  const { 
    canUseFeature, 
    isLimitReached, 
    getRemainingQuota,
    hasActiveSubscription 
  } = useSubscriptionFeatures();
  
  // Get clientId from URL query params if creating new invoice
  const queryParams = new URLSearchParams(location.search);
  const preSelectedClientId = queryParams.get('clientId');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [invoiceMode, setInvoiceMode] = useState('intl');
  const [customFields, setCustomFields] = useState([]);
  const [itemCustomFields, setItemCustomFields] = useState([]);
  
  const [formData, setFormData] = useState({
    clientId: preSelectedClientId || '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    notes: '',
    status: 'draft',
    items: [{ id: Date.now(), description: '', quantity: 1, unitPrice: 0, taxRate: 0, customFieldValues: {} }]
  });
  
  const [customFieldValues, setCustomFieldValues] = useState({});
  
  // {t('invoiceform:useEffectForClientsAndInvoice')}
  useEffect(() => {
    const initializeData = async () => {
      try {
        const clientsResponse = await api.get('/clients');
        setClients(clientsResponse.data);
        
        // 获取发票相关的自定义字段
        const customFieldsResponse = await api.get('/custom-fields?target=invoice');
        setCustomFields(customFieldsResponse.data);
        
        // 获取发票项目相关的自定义字段
        const itemCustomFieldsResponse = await api.get('/custom-fields?target=item');
        setItemCustomFields(itemCustomFieldsResponse.data);
        
        if (isEditing) {
          const invoiceResponse = await api.get(`/invoices/${id}`);
          const invoice = invoiceResponse.data;
          
          // 获取发票项目的自定义字段值
          const itemCustomFieldValues = {};
          if (invoice.InvoiceItems && Array.isArray(invoice.InvoiceItems)) {
            for (const item of invoice.InvoiceItems) {
              if (item.CustomFieldValues && Array.isArray(item.CustomFieldValues)) {
                itemCustomFieldValues[item.id] = {};
                item.CustomFieldValues.forEach(fieldValue => {
                  itemCustomFieldValues[item.id][fieldValue.customFieldId] = fieldValue.value;
                });
              }
            }
          }
          
          setFormData({
            clientId: invoice.clientId,
            issueDate: new Date(invoice.issueDate).toISOString().split('T')[0],
            dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
            notes: invoice.notes || '',
            status: invoice.status,
            items: (invoice.InvoiceItems && Array.isArray(invoice.InvoiceItems)) ? invoice.InvoiceItems.map(item => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
              customFieldValues: itemCustomFieldValues[item.id] || {}
            })) : []
          });
          setInvoiceMode(invoice.invoiceMode || 'intl');
          
          // 加载自定义字段值
          if (invoice.CustomFieldValues && Array.isArray(invoice.CustomFieldValues)) {
            const customFieldsData = {};
            invoice.CustomFieldValues.forEach(fieldValue => {
              customFieldsData[fieldValue.customFieldId] = fieldValue.value;
            });
            setCustomFieldValues(customFieldsData);
          }
        }
      } catch (err) {
        console.error('Error initializing data:', err);
        setError('Failed to initialize data');
      }
    };
    
    initializeData();
  }, [id, isEditing, api]);
  
  // {t('invoiceform:handleInputChange')}
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // {t('invoiceform:handleItemChange')}
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'description' ? value : Number(value)
    };
    
    setFormData({
      ...formData,
      items: newItems
    });
  };
  
  // {t('invoiceform:handleItemCustomFieldChange')}
  const handleItemCustomFieldChange = (itemIndex, fieldId, value) => {
    const newItems = [...formData.items];
    if (!newItems[itemIndex].customFieldValues) {
      newItems[itemIndex].customFieldValues = {};
    }
    newItems[itemIndex].customFieldValues[fieldId] = value;
    
    setFormData({
      ...formData,
      items: newItems
    });
  };
  
  // {t('invoiceform:addItem')}
  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          id: Date.now(),
          description: '',
          quantity: 1,
          unitPrice: 0,
          taxRate: 0,
          customFieldValues: {}
        }
      ]
    });
  };
  
  // {t('invoiceform:removeItem')}
  const removeItem = (index) => {
    if (formData.items.length <= 1) return;
    
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    
    setFormData({
      ...formData,
      items: newItems
    });
  };
  
  // {t('invoiceform:handleCustomFieldChange')}
  const handleCustomFieldChange = (fieldId, value) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  // {t('invoiceform:calculateItemTotal')}
  const calculateItemTotal = (item) => {
    const subtotal = item.quantity * item.unitPrice;
    const taxAmount = subtotal * (item.taxRate / 100);
    return subtotal + taxAmount;
  };
  
  // {t('invoiceform:calculateTotals')}
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    
    const taxAmount = formData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      return sum + (itemSubtotal * (item.taxRate / 100));
    }, 0);
    
    const total = subtotal + taxAmount;
    
    return { subtotal, taxAmount, total };
  };
  
  // {t('invoiceform:handleSubmit')}
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // {t('invoiceform:validateForm')}
    if (!formData.clientId) {
      setError(t('validation.selectclient'));
      return;
    }
    
    if (formData.items.some(item => !item.description)) {
      setError(t('validation.itemdescription'));
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { subtotal, taxAmount, total } = calculateTotals();
      
      const invoiceData = {
        clientId: formData.clientId,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        notes: formData.notes,
        status: formData.status,
        invoiceMode: invoiceMode,
        subtotal,
        taxAmount,
        total,
        customFieldValues: customFieldValues,
        items: formData.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: (item.quantity * item.unitPrice) * (item.taxRate / 100),
          total: calculateItemTotal(item),
          customFieldValues: item.customFieldValues || {}
        }))
      };
      
      if (isEditing) {
        await api.put(`/invoices/${id}`, invoiceData);
      } else {
        await api.post('/invoices', invoiceData);
      }
      
      navigate(`/${t('routes:invoices')}`);
    } catch (err) {
      setError(t(`errors.${isEditing ? 'updateinvoice' : 'createinvoice'}`));
      console.error(t(`errors.${isEditing ? 'updateinvoice' : 'createinvoice'}`), err);
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.currency || 'USD',
    }).format(amount);
  };
  
  const { subtotal, taxAmount, total } = calculateTotals();
  


  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(`/${t('routes:invoices')}`)}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          {t('backtoinvoices')}
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {isEditing ? t('title.edit') : t('title.create')}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-8">
            {/* {t('invoiceform:invoicePreview')} */}
            <div className="mb-8">
              <InvoicePreview 
                formData={formData}
                clients={clients}
                user={user}
                calculateTotals={calculateTotals}
                calculateItemTotal={calculateItemTotal}
                formatCurrency={formatCurrency}
                invoiceMode={invoiceMode}
                customFieldValues={customFieldValues}
              />
            </div>
            
            {/* {t('invoiceform:errorMessage')} */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* {t('invoiceform:clientSelection')} */}
              <div>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                  {t('client')}
                </label>
                <select
                  id="clientId"
                  name="clientId"
                  className="mt-1 block w-full form-input"
                  value={formData.clientId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">{t('selectclient')}</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.company ? `${client.company} (${client.name})` : client.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* {t('invoiceform:status')} */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  {t('status')}
                </label>
                <select
                  id="status"
                  name="status"
                  className="mt-1 block w-full form-input"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="draft">{t('statusOptions.draft')}</option>
                  <option value="sent">{t('statusOptions.sent')}</option>
                  <option value="paid">{t('statusOptions.paid')}</option>
                  <option value="overdue">{t('statusOptions.overdue')}</option>
                  <option value="cancelled">{t('statusOptions.cancelled')}</option>
                </select>
              </div>
              
              {/* {t('invoiceform:issueDate')} */}
              <div>
                <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">
                  {t('issuedate')}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="issueDate"
                    name="issueDate"
                    className="form-input-with-icon w-full"
                    value={formData.issueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              {/* {t('invoiceform:dueDate')} */}
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                  {t('duedate')}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    className="form-input-with-icon w-full"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            
            
            
            
            
            {/* {t('invoiceform:notes')} */}
            <div className="mt-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                {t('notes')}
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="mt-1 block w-full form-input"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder={t('notesplaceholder')}
              />
            </div>
            
            {/* {t('invoiceform:customFields')} */}
            {customFields.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">{t('customfields')}</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {customFields.map(field => (
                    <CustomFieldInput
                      key={field.id}
                      field={field}
                      value={customFieldValues[field.id] || ''}
                      onChange={(value) => handleCustomFieldChange(field.id, value)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* {t('invoiceform:invoiceItems')} */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-sm font-medium text-gray-900">{t('items')}</h4>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  onClick={addItem}
                >
                  <FiPlus className="mr-1 h-4 w-4" />
                  {t('additem')}
                </button>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">{t('description')}</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('qty')}</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('price')}</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('taxpercent')}</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('total')}</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item, index) => (
                        <>
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                className="form-input w-full"
                                value={item.description}
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                placeholder={t('descriptionplaceholder')}
                                required
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                min="1"
                                step="1"
                                className="form-input w-full text-right"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                required
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FiDollarSign className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="form-input pl-7 w-full text-right"
                                  value={item.unitPrice}
                                  onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                  required
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                className="form-input w-full text-right"
                                value={item.taxRate}
                                onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(calculateItemTotal(item))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                type="button"
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => removeItem(index)}
                                disabled={formData.items.length <= 1}
                              >
                                <FiTrash2 className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                          {/* 发票项目自定义字段 */}
                          {itemCustomFields.length > 0 && (
                            <tr key={`custom-fields-${item.id}`}>
                              <td colSpan="6" className="px-6 py-4 bg-gray-50">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                  {itemCustomFields.map(field => (
                                    <CustomFieldInput
                                      key={field.id}
                                      field={field}
                                      value={item.customFieldValues[field.id] || ''}
                                      onChange={(value) => handleItemCustomFieldChange(index, field.id, value)}
                                    />
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{t('subtotal')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(subtotal)}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{t('tax')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(taxAmount)}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">{t('total')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">{formatCurrency(total)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          {/* {t('invoiceform:formActions')} */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/${t('routes:invoices')}`)}
            >
              {t('cancel')}
            </button>
            <FeatureGate 
              feature="invoices" 
              fallback={
                <button
                  type="button"
                  className="btn btn-primary opacity-50 cursor-not-allowed"
                  disabled
                >
                  <FiSave className="mr-2 h-4 w-4" />
                  需要升级订阅
                </button>
              }
            >
              <button
                type="submit"
                className="btn btn-primary flex items-center"
                disabled={loading}
              >
                <FiSave className="mr-2 h-4 w-4" />
                {loading ? t('saving') : (isEditing ? t('updateinvoice') : t('createinvoice'))}
              </button>
            </FeatureGate>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;