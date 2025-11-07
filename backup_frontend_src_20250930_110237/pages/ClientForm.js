import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';


const ClientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const { t } = useTranslation(['common', 'clientform', 'routes']);
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEditing);
  const [error, setError] = useState(null);

  
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    vatNumber: '',
    siren: '',
    siret: ''
  });
  
  const fetchClient = useCallback(async () => {
    try {
      setFetchLoading(true);
      const response = await api.get(`/clients/${id}`);
      const client = response.data.client;
      
      setFormData({
        name: client.name,
        company: client.company || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        postalCode: client.postalCode || '',
        country: client.country || 'France',
        vatNumber: client.vatNumber || '',
        siren: client.siren || '',
        siret: client.siret || ''
      });
      

    } catch (err) {
      setError(t('clientform.errors.fetchclient'));
      console.error(err);
    } finally {
      setFetchLoading(false);
    }
  }, [id, api]);
  

  
  useEffect(() => {
    if (isEditing) {
      fetchClient();
    }
    

  }, [id, fetchClient, isEditing]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      setError(t('clientform.validation.namerequired'));
      return;
    }
    
    // 验证SIREN格式（如果提供）
    if (formData.siren && formData.siren.length !== 9) {
      setError('SIREN号码必须为9位数字');
      return;
    }
    
    // 验证SIRET格式（如果提供）
    if (formData.siret && formData.siret.length !== 14) {
      setError('SIRET号码必须为14位数字');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 准备提交数据
      const submitData = {
        ...formData
      };
      
      if (isEditing) {
        await api.put(`/clients/${id}`, submitData);
      } else {
        await api.post('/clients', submitData);
      }
      
      navigate(`/${t('routes:clients')}`);
    } catch (err) {
      setError(t(`clientform.errors.${isEditing ? 'updateclient' : 'createclient'}`));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (fetchLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
        <p className="mt-4 text-gray-500">{t('clientform.loading')}</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate(`/${t('routes:clients')}`)}
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <FiArrowLeft className="mr-2 h-4 w-4" />
          {t('clientform.backtoclients')}
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {isEditing ? t('clientform.title.edit') : t('clientform.title.create')}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-8">
            {/* Error message */}
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
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  {t('clientform.name')} <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input-with-icon w-full"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t('clientform.placeholders.name')}
                    required
                  />
                </div>
              </div>
              
              {/* VAT Number */}
              <div>
                <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700">
                  VAT号码
                </label>
                <input
                  type="text"
                  id="vatNumber"
                  name="vatNumber"
                  className="mt-1 block w-full form-input"
                  value={formData.vatNumber}
                  onChange={handleInputChange}
                  placeholder="FR12345678901"
                />
              </div>
              
              {/* Company */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  {t('clientform.company')}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiBriefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    className="form-input-with-icon w-full"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder={t('clientform.placeholders.company')}
                  />
                </div>
              </div>
              
              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  {t('clientform.phone')}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="form-input-with-icon w-full"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t('clientform.placeholders.phone')}
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-6">
              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  城市
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  className="mt-1 block w-full form-input"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Paris"
                />
              </div>
              
              {/* Postal Code */}
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                  邮政编码
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  className="mt-1 block w-full form-input"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="75001"
                />
              </div>
              
              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  国家
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  className="mt-1 block w-full form-input"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="France"
                />
              </div>
              
              {/* SIREN */}
              <div>
                <label htmlFor="siren" className="block text-sm font-medium text-gray-700">
                  SIREN号码
                </label>
                <input
                  type="text"
                  id="siren"
                  name="siren"
                  className="mt-1 block w-full form-input"
                  value={formData.siren}
                  onChange={handleInputChange}
                  placeholder="123456789"
                  maxLength="9"
                />
              </div>
            </div>
            
            {/* Address */}
            <div className="mt-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                {t('clientform.address')}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  className="form-input-with-icon w-full"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder={t('clientform.placeholders.address')}
                />
              </div>
            </div>
            
            {/* SIRET */}
            <div className="mt-6">
              <label htmlFor="siret" className="block text-sm font-medium text-gray-700">
                SIRET号码
              </label>
              <input
                type="text"
                id="siret"
                name="siret"
                className="mt-1 block w-full form-input"
                value={formData.siret}
                onChange={handleInputChange}
                placeholder="12345678901234"
                maxLength="14"
              />
            </div>
            

            
            
            
            
          </div>
          
          {/* Form actions */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/${t('routes:clients')}`)}
            >
              {t('clientform.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center"
              disabled={loading}
            >
              <FiSave className="mr-2 h-4 w-4" />
              {loading ? t('clientform.saving') : (isEditing ? t('clientform.updateclient') : t('clientform.createclient'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;