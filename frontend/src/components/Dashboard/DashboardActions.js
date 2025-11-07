import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiBarChart2, FiDownload } from 'react-icons/fi';
import { Button } from '../DesignSystem';
import { Link } from 'react-router-dom';
import { AdvancedFeaturesGuard } from '../SubscriptionGuard';

const DashboardActions = () => {
  const { t } = useTranslation(['dashboard', 'routes']);
  
  return (
    <div className="flex flex-wrap gap-4 mb-8">
      <Link to={`/${t('routes:newInvoice')}`}>
        <Button
          leftIcon={<FiPlus />}
          size="lg"
        >
          {t('dashboard:newInvoice')}
        </Button>
      </Link>
      
      <Link to={`/${t('routes:reports')}`}>
        <Button
          leftIcon={<FiBarChart2 />}
          variant="outline"
          size="lg"
        >
          {t('dashboard:viewDetailedReports')}
        </Button>
      </Link>
      
      <AdvancedFeaturesGuard>
        <Button
          leftIcon={<FiDownload />}
          variant="outline"
          size="lg"
          onClick={() => {
            // {t('dashboard:implementExportFunction')}
          }}
        >
          {t('dashboard:exportData')}
        </Button>
      </AdvancedFeaturesGuard>
    </div>
  );
};

export default DashboardActions;