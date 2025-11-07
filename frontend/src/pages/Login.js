import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Card,
  CardBody,
  FormGroup,
  Input,
  Button
} from '../components/DesignSystem';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'login', 'routes']);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success(t('common:success'));
        // 使用replace而不是navigate，避免页面刷新
        navigate(`/${t('routes:dashboard')}`, { replace: true });
      } else {
        toast.error(result.message || t('common:error'));
      }
    } catch (error) {
      toast.error(error.message || t('common:error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="shadow-xl">
          <CardBody className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {t('login:title')}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {t('login:subtitle')}{' '}
                <Link to={`/${t('routes:register')}`} className="font-medium text-primary-600 hover:text-primary-500">
                  {t('login:register')}
                </Link>
              </p>
              <p className="mt-4 text-lg font-semibold text-primary-600">
                {t('login:taxIntegration')}
              </p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>

              
              <FormGroup label={t('login:email')}>
                <Input
                  type="email"
                  placeholder={t('login:emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormGroup>
              
              <FormGroup label={t('login:password')}>
                <Input
                  type="password"
                  placeholder={t('login:passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </FormGroup>

              <Button
                type="submit"
                loading={loading}
                className="w-full"
              >
                {t('login:submit')}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Login;