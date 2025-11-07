import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody } from '../DesignSystem';
import { FiCheckCircle, FiAlertCircle, FiGlobe, FiInfo } from 'react-icons/fi';

const TaxComplianceBanner = ({ country }) => {
  const { t } = useTranslation(['dashboard', 'common']);

  if (!country) return null;

  const getCountrySpecificInfo = () => {
    if (country === 'FR') {
      return {
        title: t('dashboard:franceTaxCompliance'),
        description: t('dashboard:franceTaxComplianceDesc'),
        status: 'compliant',
        statusText: t('dashboard:pfuCompliant'),
        lastUpdated: t('dashboard:lastUpdatedPFU'),
        features: [
          t('dashboard:pfuIntegration'),
          t('dashboard:vatCompliance'),
          t('dashboard:facturXSupport')
        ]
      };
    }
    return null;
  };

  const countryInfo = getCountrySpecificInfo();
  if (!countryInfo) return null;

  return (
    <Card className="mb-8 border-l-4 border-l-primary-500">
      <CardBody>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="p-2 rounded-full bg-primary-100">
              <FiGlobe className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {countryInfo.title}
              </h3>
              <div className="flex items-center">
                <FiCheckCircle className="h-5 w-5 text-green-500 mr-1" />
                <span className="text-sm font-medium text-green-700">
                  {countryInfo.statusText}
                </span>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {countryInfo.description}
            </p>
            <div className="mt-3">
              <div className="flex items-center text-xs text-gray-500 mb-2">
                <FiInfo className="h-4 w-4 mr-1" />
                <span>{countryInfo.lastUpdated}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {countryInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <FiCheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default TaxComplianceBanner;