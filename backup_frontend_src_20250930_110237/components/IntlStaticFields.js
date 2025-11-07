import React from 'react';
import { useTranslation } from 'react-i18next';
import { FormGroup, Input } from '../components/DesignSystem';

const IntlStaticFields = ({ value, onChange }) => {
  const { t } = useTranslation(['common']);

  const handleInputChange = (field, fieldValue) => {
    onChange({
      ...value,
      [field]: fieldValue
    });
  };

  return (
    <>
      <FormGroup label="Company Name">
        <Input
          type="text"
          value={value?.companyName || ''}
          onChange={(e) => handleInputChange('companyName', e.target.value)}
          placeholder="Enter your company name"
        />
      </FormGroup>
      
      <FormGroup label="Company Address">
        <Input
          type="text"
          value={value?.companyAddress || ''}
          onChange={(e) => handleInputChange('companyAddress', e.target.value)}
          placeholder="Enter your company address"
        />
      </FormGroup>
      
      <FormGroup label="Tax ID">
        <Input
          type="text"
          value={value?.taxId || ''}
          onChange={(e) => handleInputChange('taxId', e.target.value)}
          placeholder="Enter your tax ID"
        />
      </FormGroup>
    </>
  );
};

export default IntlStaticFields;