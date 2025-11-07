import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation(['common', 'navigation']);
  
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} {t('common:app.name')}. All rights reserved.
            </p>
          </div>
          <div className="mt-4 flex justify-center space-x-6 md:mt-0">
            <Link to="/pricing" className="text-sm text-gray-500 hover:text-gray-700">
              {t('navigation:pricing')}
            </Link>
            <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-700">
              {t('navigation:terms')}
            </Link>
            <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
              {t('navigation:privacy')}
            </Link>
            <Link to="/legal" className="text-sm text-gray-500 hover:text-gray-700">
              {t('navigation:legal')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;