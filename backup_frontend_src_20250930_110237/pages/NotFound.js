import { Link } from 'react-router-dom';
import { FiHome, FiSearch } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation(['common', 'routes']);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">
              <FiSearch className="h-8 w-8 text-gray-500" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{t('common:notfound.title')}</h2>
            <p className="mt-2 text-sm text-gray-500">
              {t('common:notfound.message')}
            </p>
            <div className="mt-6">
              <Link
                to={`/${t('routes:dashboard')}`}
                className="btn btn-primary flex items-center justify-center"
              >
                <FiHome className="mr-2 h-4 w-4" />
                {t('common:notfound.backtodashboard')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;