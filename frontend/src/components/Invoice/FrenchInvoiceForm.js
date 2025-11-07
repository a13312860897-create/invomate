import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUnifiedData } from '../../contexts/UnifiedDataContext';

// French VAT rate constants
const FRENCH_VAT_RATES = {
  standard: { rate: 20, label: 'Standard rate (20%)' },
  reduced: { rate: 10, label: 'Reduced rate (10%)' },
  superReduced: { rate: 5.5, label: 'Super-reduced rate (5.5%)' },
  special: { rate: 2.1, label: 'Special rate (2.1%)' }
};

// French invoice type constants
const FRENCH_INVOICE_TYPES = {
  standard: { value: 'standard', label: 'Standard Invoice', description: 'Standard invoice' },
  credit: { value: 'credit', label: 'Credit Note', description: 'Credit note' },
  debit: { value: 'debit', label: 'Debit Note', description: 'Debit note' },
  proforma: { value: 'proforma', label: 'Pro forma Invoice', description: 'Pro forma invoice' },
  advance: { value: 'advance', label: 'Advance Invoice', description: 'Advance invoice' },
  final: { value: 'final', label: 'Final Invoice', description: 'Final invoice' }
};

const FrenchInvoiceForm = ({ formData, setFormData, selectedClient, validationErrors, setValidationErrors }) => {
  const { user } = useAuth();
  const { userProfile } = useUnifiedData();
  
  // Get French company settings from user profile
  const getFrenchCompanySettings = () => {
    try {
      // Prefer unified data management user profile
      if (userProfile) {
        return {
          sellerCompanyName: userProfile.companyName || '',
          sellerAddress: userProfile.address || '',
          sellerVATNumber: userProfile.vatNumber || '',
          sellerSIREN: userProfile.sirenNumber || userProfile.siren || '',
          sellerPhone: userProfile.phone || '',
          sellerWebsite: '',
          sellerSIRET: userProfile.siretNumber || '',
          sellerRCS: userProfile.rcsNumber || '',
          sellerNAF: userProfile.nafCode || '',
          sellerLegalForm: userProfile.legalForm || '',
          sellerRegisteredCapital: userProfile.registeredCapital || '',
          bankIBAN: userProfile.bankIBAN || '',
          bankBIC: userProfile.bankBIC || '',
          bankName: userProfile.bankName || '',
          accountHolder: userProfile.accountHolder || ''
        };
      }
      // Fallback to local storage
      const settings = localStorage.getItem('frenchCompanySettings');
      if (settings) {
        return JSON.parse(settings);
      }
    } catch (error) {
      console.error('Failed to get French company settings:', error);
    }
    // Default values
    return {
      sellerCompanyName: '',
      sellerAddress: '',
      sellerVATNumber: '',
      sellerSIREN: '',
      sellerPhone: '',
      sellerWebsite: '',
      sellerSIRET: '',
      sellerRCS: '',
      sellerNAF: '',
      sellerLegalForm: '',
      sellerRegisteredCapital: ''
    };
  };

  const companySettings = getFrenchCompanySettings();
  const generateFrenchInvoiceNumber = (year = new Date().getFullYear(), sequence = 1) => {
    // Use timestamp suffix for uniqueness
    const timestamp = new Date().getTime().toString().slice(-6);
    return `INV-FR-${year}-${timestamp}`;
  };

  // Validate French VAT format
  const validateFrenchVAT = (vat) => {
    const frenchVATRegex = /^FR[0-9]{11}$/;
    return frenchVATRegex.test(vat);
  };

  // Validate SIREN format
  const validateSIREN = (siren) => {
    const sirenRegex = /^[0-9]{9}$/;
    return sirenRegex.test(siren);
  };

  // Ensure frenchFields exists
  React.useEffect(() => {
    if (!formData.frenchFields) {
      setFormData(prev => ({
        ...prev,
        frenchFields: {}
      }));
    }
  }, [formData.frenchFields, setFormData, formData.issueDate]);

  // French-specific required fields state
  const [frenchFields, setFrenchFields] = useState(() => ({
    invoiceType: formData.invoiceType || 'standard',
    serviceDate: formData.serviceDate || ''
  }));

  // Sync formData to local state
  useEffect(() => {
    setFrenchFields(prev => ({
      ...prev,
      invoiceType: formData.invoiceType || 'standard',
      serviceDate: formData.serviceDate || ''
    }));
  }, [formData.invoiceType, formData.serviceDate]);

  const validateFrenchFields = () => {
    const errors = {};
    
    // Validate invoice type
    if (!frenchFields.invoiceType) {
      errors.invoiceType = 'Invoice type is required';
    }
    
    // Validate service date
    if (!frenchFields.serviceDate && !formData.serviceDate) {
      errors.serviceDate = 'Service date is required (French invoice requirement)';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle French field changes
  const handleFrenchFieldChange = (field, value) => {
    setFrenchFields(prev => ({ ...prev, [field]: value }));
    
    // Update main form data to keep in sync
    if (field === 'invoiceType') {
      setFormData(prev => ({ 
        ...prev, 
        invoiceType: value,
        frenchFields: { ...prev.frenchFields, [field]: value }
      }));
    } else if (field === 'serviceDate') {
      setFormData(prev => ({ 
        ...prev, 
        serviceDate: value,
        frenchFields: { ...prev.frenchFields, [field]: value }
      }));
    } else {
      // Other French-specific fields
      setFormData(prev => ({ 
        ...prev, 
        frenchFields: { ...prev.frenchFields, [field]: value }
      }));
    }
  };



  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Invoice Type
        </label>
        <select
          value={frenchFields.invoiceType || 'standard'}
          onChange={(e) => handleFrenchFieldChange('invoiceType', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
        >
          {Object.entries(FRENCH_INVOICE_TYPES).map(([key, type]) => (
            <option key={key} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FrenchInvoiceForm;