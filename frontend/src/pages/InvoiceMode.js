import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Card,
  CardBody,
  FormGroup,
  Input,
  Button,
  Select
} from '../components/DesignSystem';
import { FiSettings, FiGlobe, FiInfo, FiCheckCircle, FiFileText } from 'react-icons/fi';
import FranceStaticFields from '../components/FranceStaticFields';
import IntlStaticFields from '../components/IntlStaticFields';

const InvoiceMode = () => {
  const { user, api } = useAuth();
  const { t } = useTranslation(['common']);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState('intl');
  const [conf, setConf] = useState({
    fr: {
      companyName: '',
      companyAddress: '',
      taxId: '',
      siren: ''
    },
    intl: {
      companyName: '',
      companyAddress: '',
      taxId: ''
    }
  });

  // 加载发票模式设置
  const loadInvoiceModeSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/settings/invoice-mode');
      
      if (response.data) {
        setMode(response.data.invoiceMode || 'intl');
        setConf(response.data.modeConfig || conf);
      }
    } catch (error) {
      console.error('Error loading invoice mode settings:', error);
      toast.error('Failed to load invoice mode settings');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadInvoiceModeSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setSaving(true);
    
    try {
      await api.put('/settings/invoice-mode', {
        invoiceMode: mode,
        modeConfig: conf
      });
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving invoice mode settings:', error);
      toast.error('Failed to save invoice mode settings');
    } finally {
      setSaving(false);
    }
  };

  const handleModeChange = (e) => {
    setMode(e.target.value);
  };

  const handleConfChange = (country, data) => {
    setConf(prev => ({
      ...prev,
      [country]: data
    }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardBody>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invoice Mode
            </h2>
            <p className="text-gray-600">
              Select your country/region to configure invoice settings specific to your location.
            </p>
          </div>

          <div className="mb-6">
            <FormGroup label="Select Country/Region">
              <Select
                value={mode}
                onChange={handleModeChange}
              >
                <option value="fr">🇫🇷 France</option>
                <option value="intl">🌍 International</option>
              </Select>
            </FormGroup>
          </div>

          <div className="mb-8">
            {mode === 'fr' && (
              <FranceStaticFields 
                value={conf.fr} 
                onChange={(data) => handleConfChange('fr', data)} 
              />
            )}
            {mode === 'intl' && (
              <IntlStaticFields 
                value={conf.intl} 
                onChange={(data) => handleConfChange('intl', data)} 
              />
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={saving}
              onClick={handleSave}
              className="flex items-center"
            >
              <FiCheckCircle className="mr-2" />
              {t('common:save')}
            </Button>
          </div>
        </CardBody>
      </Card>

      {mode === 'fr' && (
        <Card className="mt-8 border-l-4 border-l-blue-500">
          <CardBody>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="p-2 rounded-full bg-blue-100">
                  <FiInfo className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  France Tax Information
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  France has specific requirements for electronic invoicing including Chorus Pro integration and Factur-X format support.
                </p>
                <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                  <li>Chorus Pro integration for public sector invoicing</li>
                  <li>VAT compliance and reporting</li>
                  <li>Factur-X/ZUGFeRD format support</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      )}


    </div>
  );
};

export default InvoiceMode;