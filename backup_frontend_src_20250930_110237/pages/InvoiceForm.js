import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const InvoiceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, api } = useAuth();
  const { t } = useTranslation();
  const isEditing = Boolean(id);
  
  // Get clientId from URL query params if creating new invoice
  const queryParams = new URLSearchParams(location.search);
  const preSelectedClientId = queryParams.get('clientId');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  
  const [formData, setFormData] = useState({
    clientId: preSelectedClientId || '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    status: 'draft',
    items: [
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 20
      }
    ]
  });

  // Load clients on component mount
  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await api.get('/clients');
        // Handle the nested data structure from the API
        const clientsData = response.data?.data?.clients || response.data || [];
        setClients(Array.isArray(clientsData) ? clientsData : []);
      } catch (error) {
        console.error('Error loading clients:', error);
        setError('Failed to load clients');
        setClients([]); // Ensure clients is always an array
      }
    };

    loadClients();
  }, [api]);

  // Load invoice data if editing
  useEffect(() => {
    if (isEditing && id) {
      const loadInvoice = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/invoices/${id}`);
          const invoice = response.data;
          
          setFormData({
            clientId: invoice.clientId || '',
            issueDate: invoice.issueDate ? invoice.issueDate.split('T')[0] : '',
            dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
            notes: invoice.notes || '',
            status: invoice.status || 'draft',
            items: invoice.items || [{ description: '', quantity: 1, unitPrice: 0, taxRate: 20 }]
          });
        } catch (error) {
          console.error('Error loading invoice:', error);
          setError('Failed to load invoice');
        } finally {
          setLoading(false);
        }
      };

      loadInvoice();
    }
  }, [isEditing, id, api]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'unitPrice' || field === 'taxRate' ? parseFloat(value) || 0 : value
    };
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0, taxRate: 20 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
    }
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.clientId) {
      setError('Please select a client');
      return;
    }
    
    if (formData.items.some(item => !item.description)) {
      setError('Please provide description for all items');
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
        subtotal,
        taxAmount,
        total,
        items: formData.items
      };

      if (isEditing) {
        await api.put(`/invoices/${id}`, invoiceData);
      } else {
        await api.post('/invoices', invoiceData);
      }
      
      navigate(`/${t('routes:invoices')}`);
    } catch (err) {
      setError(isEditing ? 'Failed to update invoice' : 'Failed to create invoice');
      console.error('Error saving invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: user?.currency || 'EUR',
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

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditing ? t('editinvoice') : t('invoices:createTitle')}
          </h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-8">
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
              {/* Client Selection */}
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
                  {Array.isArray(clients) && clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company && `(${client.company})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Issue Date */}
              <div>
                <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">
                  {t('issuedate')}
                </label>
                <input
                  type="date"
                  id="issueDate"
                  name="issueDate"
                  className="mt-1 block w-full form-input"
                  value={formData.issueDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                  {t('duedate')}
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  className="mt-1 block w-full form-input"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Status */}
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
                  <option value="draft">{t('draft')}</option>
                  <option value="sent">{t('sent')}</option>
                  <option value="paid">{t('paid')}</option>
                  <option value="overdue">{t('overdue')}</option>
                </select>
              </div>
            </div>

            {/* Items */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t('items')}</h3>
              
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 mb-4 items-end">
                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('description')}
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full form-input"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('quantity')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full form-input"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('unitprice')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full form-input"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('taxrate')} (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className="mt-1 block w-full form-input"
                      value={item.taxRate}
                      onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('total')}
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      {formatCurrency(item.quantity * item.unitPrice * (1 + item.taxRate / 100))}
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800"
                      disabled={formData.items.length === 1}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addItem}
                className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                + {t('additem')}
              </button>
            </div>

            {/* Notes */}
            <div className="mt-8">
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
              />
            </div>

            {/* Totals */}
            <div className="mt-8 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>{t('subtotal')}:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span>{t('tax')}:</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold mt-2 pt-2 border-t">
                <span>{t('total')}:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/${t('routes:invoices')}`)}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center"
              disabled={loading}
            >
              <FiSave className="mr-2 h-4 w-4" />
              {loading ? t('saving') : (isEditing ? t('updateinvoice') : t('createinvoice'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;