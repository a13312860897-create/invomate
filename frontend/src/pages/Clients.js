import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiMail, FiPhone, FiMapPin, FiEdit, FiTrash2, FiUser } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useUnifiedData } from '../contexts/UnifiedDataContext';
import { useTranslation } from 'react-i18next';
import MobileClientList from '../components/MobileClientList';

const Clients = () => {
  const { api } = useAuth();
  const { t } = useTranslation(['common', 'clients', 'routes']);
  
  // 使用统一数据管理
  const {
    clients,
    createClient,
    updateClient,
    deleteClient,
    userProfile,
    loadClients,
    loading,
    error,
    clearError
  } = useUnifiedData();
  
  // 本地UI状态
  const [success, setSuccess] = useState(null);
  const [localError, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    vatNumber: '',
    siren: '',
    siret: '',
    // 交付地址字段
    deliveryAddress: '',
    deliveryCity: '',
    deliveryPostalCode: '',
    deliveryCountry: 'France',
    sameAsAddress: true // 默认与账单地址相同
  });
  
  // 组件加载时获取客户数据
  useEffect(() => {
    loadClients();
  }, [loadClients]);
  
  // 成功消息自动清除
  useEffect(() => {
    let timer;
    if (success) {
      timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success]);

  // 错误消息自动清除
  useEffect(() => {
    let timer;
    if (error) {
      timer = setTimeout(() => {
        clearError();
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [error, clearError]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'sameAsAddress') {
      // 处理"与账单地址相同"复选框
      setNewClient(prev => ({
        ...prev,
        sameAsAddress: checked,
        deliveryAddress: checked ? prev.address : prev.deliveryAddress,
        deliveryCity: checked ? prev.city : prev.deliveryCity,
        deliveryPostalCode: checked ? prev.postalCode : prev.deliveryPostalCode,
        deliveryCountry: checked ? prev.country : prev.deliveryCountry
      }));
    } else {
      const newValue = type === 'checkbox' ? checked : value;
      setNewClient(prev => {
        const updated = {
          ...prev,
          [name]: newValue
        };
        
        // 如果修改的是账单地址字段且sameAsAddress为true，同步更新交付地址
        if (prev.sameAsAddress && ['address', 'city', 'postalCode', 'country'].includes(name)) {
          const deliveryFieldMap = {
            address: 'deliveryAddress',
            city: 'deliveryCity',
            postalCode: 'deliveryPostalCode',
            country: 'deliveryCountry'
          };
          const deliveryField = deliveryFieldMap[name];
          if (deliveryField) {
            updated[deliveryField] = newValue;
          }
        }
        
        return updated;
      });
    }
  };
  
  const handleAddClient = async (e) => {
    e.preventDefault();
    try {
      // 使用统一数据管理创建客户
      await createClient(newClient);
      setSuccess(t('clients:successfullyAdded'));
      setShowAddModal(false);
      setNewClient({
      name: '',
      email: '',
      company: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'France',
      vatNumber: '',
      siren: '',
      siret: '',
      // 交付地址字段
      deliveryAddress: '',
      deliveryCity: '',
      deliveryPostalCode: '',
      deliveryCountry: 'France',
      sameAsAddress: true
    });
    } catch (err) {
      console.error('Add client error:', err);
    }
  };
  
  const handleEditClient = async (e) => {
    e.preventDefault();
    try {
      // 使用统一数据管理更新客户
      await updateClient(selectedClient.id, selectedClient);
      setSuccess(t('clients:successfullyUpdated'));
      setShowEditModal(false);
    } catch (err) {
      console.error('Update client error:', err);
    }
  };
  
  const handleDeleteClient = async () => {
    try {
      // 使用统一数据管理删除客户
      await deleteClient(selectedClient.id);
      setSuccess(t('clients:successfullyDeleted'));
      setShowDeleteModal(false);
      setSelectedClient(null);
    } catch (err) {
      console.error('Delete client error:', err);
    }
  };
  
  const openEditModal = (client) => {
    setSelectedClient({ ...client });
    setShowEditModal(true);
  };
  
  const openDeleteModal = (client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };
  
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'sameAsAddress') {
      // 处理"与账单地址相同"复选框
      setSelectedClient(prev => ({
        ...prev,
        sameAsAddress: checked,
        deliveryAddress: checked ? prev.address : prev.deliveryAddress,
        deliveryCity: checked ? prev.city : prev.deliveryCity,
        deliveryPostalCode: checked ? prev.postalCode : prev.deliveryPostalCode,
        deliveryCountry: checked ? prev.country : prev.deliveryCountry
      }));
    } else {
      const newValue = type === 'checkbox' ? checked : value;
      setSelectedClient(prev => {
        const updated = {
          ...prev,
          [name]: newValue
        };
        
        // 如果修改的是账单地址字段且sameAsAddress为true，同步更新交付地址
        if (prev.sameAsAddress && ['address', 'city', 'postalCode', 'country'].includes(name)) {
          const deliveryFieldMap = {
            address: 'deliveryAddress',
            city: 'deliveryCity',
            postalCode: 'deliveryPostalCode',
            country: 'deliveryCountry'
          };
          const deliveryField = deliveryFieldMap[name];
          if (deliveryField) {
            updated[deliveryField] = newValue;
          }
        }
        
        return updated;
      });
    }
  };

  // 获取过滤后的客户列表
  const filteredClients = clients.filter(client => {
    // 首先检查client是否存在
    if (!client) return false;
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (client.name && client.name.toLowerCase().includes(searchLower)) ||
      (client.email && client.email.toLowerCase().includes(searchLower)) ||
      (client.company && client.company.toLowerCase().includes(searchLower)) ||
      (client.phone && client.phone.includes(searchTerm)) ||
      (client.address && client.address.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6 pt-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('clients:title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('clients:subtitle')}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FiPlus className="mr-2 h-4 w-4" />
            {t('clients:addClient')}
          </button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('clients:searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* 成功消息 */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* 错误消息 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 客户列表 */}
      {loading ? (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">{t('common:loading')}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 桌面端客户列表 */}
          <div className="hidden md:block bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredClients.length === 0 ? (
                <li key="no-clients" className="px-6 py-4">
                  <div className="text-center">
                    <FiUser className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {searchTerm ? t('clients:noSearchResults') : t('clients:noClients')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? t('clients:tryDifferentSearch') : t('clients:getStarted')}
                    </p>
                    {!searchTerm && (
                      <div className="mt-6">
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <FiPlus className="mr-2 h-4 w-4" />
                          {t('clients:addFirstClient')}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ) : (
                filteredClients.map((client) => (
                  <li key={client.id}>
                    <div className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <FiUser className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {client.name}
                              </div>
                              {client.company && (
                                <div className="ml-2 text-sm text-gray-500">
                                  ({client.company})
                                </div>
                              )}
                            </div>
                            <div className="flex items-center mt-1 space-x-4">
                              {client.email && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <FiMail className="mr-1 h-4 w-4" />
                                  {client.email}
                                </div>
                              )}
                              {client.phone && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <FiPhone className="mr-1 h-4 w-4" />
                                  {client.phone}
                                </div>
                              )}
                              {client.address && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <FiMapPin className="mr-1 h-4 w-4" />
                                  {client.address}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(client)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(client)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* 移动端客户列表 */}
          <div className="md:hidden">
            <MobileClientList
              clients={filteredClients}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              searchTerm={searchTerm}
              onAddClient={() => setShowAddModal(true)}
            />
          </div>
        </>
      )}

      {/* 添加客户模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowAddModal(false)}></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{t('clients:addClient')}</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleAddClient} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('clients:name')} *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={newClient.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        邮箱地址
                      </label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiMail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={newClient.email}
                          onChange={handleInputChange}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="client@example.com"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('clients:company')}
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={newClient.company}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('clients:phone')}
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={newClient.phone}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('clients:vatNumber')}
                      </label>
                      <input
                        type="text"
                        name="vatNumber"
                        value={newClient.vatNumber}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="FR12345678901"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('clients:siren')}
                      </label>
                      <input
                        type="text"
                        name="siren"
                        value={newClient.siren}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123456789"
                        maxLength="9"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('clients:siret')}
                      </label>
                      <input
                        type="text"
                        name="siret"
                        value={newClient.siret}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="12345678901234"
                        maxLength="14"
                      />
                    </div>
                  </div>
                  
                  {/* 账单地址部分 */}
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">账单地址</h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('clients:address')}
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={newClient.address}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('clients:city')}
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={newClient.city}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('clients:postalCode')}
                        </label>
                        <input
                          type="text"
                          name="postalCode"
                          value={newClient.postalCode}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          {t('clients:country')}
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={newClient.country}
                          onChange={handleInputChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                
                  {/* 交付地址部分 */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">交付地址</h4>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="sameAsAddress"
                          checked={newClient.sameAsAddress}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">与账单地址相同</span>
                      </label>
                    </div>
                    
                    {!newClient.sameAsAddress && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            交付地址
                          </label>
                          <input
                            type="text"
                            name="deliveryAddress"
                            value={newClient.deliveryAddress}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              交付城市
                            </label>
                            <input
                              type="text"
                              name="deliveryCity"
                              value={newClient.deliveryCity}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              交付邮政编码
                            </label>
                            <input
                              type="text"
                              name="deliveryPostalCode"
                              value={newClient.deliveryPostalCode}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              交付国家
                            </label>
                            <input
                              type="text"
                              name="deliveryCountry"
                              value={newClient.deliveryCountry}
                              onChange={handleInputChange}
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                 </form>
               </div>
               
               <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                 <button
                   type="button"
                   onClick={handleAddClient}
                   className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                 >
                   创建客户
                 </button>
                 <button
                   type="button"
                   onClick={() => setShowAddModal(false)}
                   className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                 >
                   取消
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

      {/* 编辑客户模态框 */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('clients:editClient')}
              </h3>
              <form onSubmit={handleEditClient} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('clients:name')} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={selectedClient.name}
                    onChange={handleEditInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('clients:company')}
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={selectedClient.company || ''}
                    onChange={handleEditInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    邮箱地址
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={selectedClient.email || ''}
                      onChange={handleEditInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="client@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('clients:phone')}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={selectedClient.phone || ''}
                    onChange={handleEditInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('clients:address')}
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={selectedClient.address || ''}
                    onChange={handleEditInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('clients:city')}
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={selectedClient.city || ''}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('clients:postalCode')}
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={selectedClient.postalCode || ''}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('clients:country')}
                  </label>
                  <select
                    name="country"
                    value={selectedClient.country || 'France'}
                    onChange={handleEditInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="France">France</option>
                    <option value="Germany">Germany</option>
                    <option value="Spain">Spain</option>
                    <option value="Italy">Italy</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('clients:vatNumber')}
                  </label>
                  <input
                    type="text"
                    name="vatNumber"
                    value={selectedClient.vatNumber || ''}
                    onChange={handleEditInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('clients:siren')}
                    </label>
                    <input
                      type="text"
                      name="siren"
                      value={selectedClient.siren || ''}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('clients:siret')}
                    </label>
                    <input
                      type="text"
                      name="siret"
                      value={selectedClient.siret || ''}
                      onChange={handleEditInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                {/* 交付地址部分 */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">交付地址</h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="sameAsAddress"
                        checked={selectedClient.sameAsAddress || false}
                        onChange={handleEditInputChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">与账单地址相同</span>
                    </label>
                  </div>
                  
                  {!selectedClient.sameAsAddress && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          交付地址
                        </label>
                        <input
                          type="text"
                          name="deliveryAddress"
                          value={selectedClient.deliveryAddress || ''}
                          onChange={handleEditInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            交付城市
                          </label>
                          <input
                            type="text"
                            name="deliveryCity"
                            value={selectedClient.deliveryCity || ''}
                            onChange={handleEditInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            交付邮政编码
                          </label>
                          <input
                            type="text"
                            name="deliveryPostalCode"
                            value={selectedClient.deliveryPostalCode || ''}
                            onChange={handleEditInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          交付国家
                        </label>
                        <select
                          name="deliveryCountry"
                          value={selectedClient.deliveryCountry || 'France'}
                          onChange={handleEditInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                          <option value="France">France</option>
                          <option value="Germany">Germany</option>
                          <option value="Spain">Spain</option>
                          <option value="Italy">Italy</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {t('common:cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {t('clients:updateClient')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteModal && selectedClient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <FiTrash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                {t('clients:deleteClient')}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  {t('clients:deleteConfirmation', { name: selectedClient.name })}
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('common:cancel')}
                </button>
                <button
                  onClick={handleDeleteClient}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {t('clients:delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;