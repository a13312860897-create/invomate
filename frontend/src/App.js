import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { UnifiedDataProvider } from './contexts/UnifiedDataContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Clients from './pages/Clients';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import InvoiceForm from './pages/InvoiceForm';
import NewInvoiceForm from './pages/NewInvoiceForm';
import InvoiceDetail from './pages/InvoiceDetail';
import OverdueInvoicesDetails from './components/OverdueInvoicesDetails';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import LegalNotice from './pages/LegalNotice';
import PaddlePricing from './pages/PaddlePricing';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import SubscriptionSettings from './pages/SubscriptionSettings';
import SubscriptionTestPage from './pages/SubscriptionTestPage';
import SubscriptionTest from './pages/SubscriptionTest';
import PaymentTest from './components/PaymentTest';
import UpgradePage from './components/UpgradePage';
import PaymentPage from './components/Payment/PaymentPage';
import PaymentSuccess from './components/Payment/PaymentSuccess';
import TestPaymentPage from './pages/TestPaymentPage';
import ProtectedRoute from './components/ProtectedRoute';
import ExpiryNotification from './components/ExpiryNotification';
import { Toaster } from 'react-hot-toast';
import completeDataCleanup from './utils/completeDataCleanup';



function App() {
  // 生产模式一次性清理测试数据与设置
  useEffect(() => {
    const done = localStorage.getItem('prodCleanupDone');
    if (!done) {
      (async () => {
        try {
          await completeDataCleanup();
          localStorage.setItem('prodCleanupDone', '1');
          console.log('生产模式清理完成');
        } catch (e) {
          console.warn('生产模式清理失败:', e);
        }
      })();
    }
  }, []);
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <UnifiedDataProvider>
              <div className="App">
                <Toaster position="top-right" />
                <ExpiryNotification />
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  {/* 公共支付路由 - 不需要认证 */}
                  <Route path="/payment/:token" element={<PaymentPage />} />
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/test-payment" element={<TestPaymentPage />} />
                  
                  <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="invoices" element={<Invoices />} />
                    <Route path="invoices/new" element={<NewInvoiceForm />} />
                    <Route path="invoices/edit/:id" element={<InvoiceForm />} />
                    <Route path="invoices/:id" element={<InvoiceDetail />} />
                    <Route path="overdue-invoices" element={<OverdueInvoicesDetails />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="pricing" element={<PaddlePricing />} />
                    <Route path="paddle-pricing" element={<PaddlePricing />} />
                    <Route path="payment-success" element={<PaymentSuccessPage />} />
                  <Route path="payment-success-new" element={<PaymentSuccessPage />} />
                  <Route path="subscription" element={<SubscriptionSettings />} />
                  {/* 兼容旧链接：/subscription-settings */}
                  <Route path="subscription-settings" element={<SubscriptionSettings />} />
                    <Route path="subscription-test" element={<SubscriptionTestPage />} />
                    <Route path="subscription-debug" element={<SubscriptionTest />} />
                    <Route path="payment-test" element={<PaymentTest />} />
                    <Route path="upgrade" element={<UpgradePage />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="email-config" element={<Navigate to="/settings?tab=email" replace />} />
                    <Route path="terms" element={<Terms />} />
                    <Route path="privacy" element={<Privacy />} />
                    <Route path="legal" element={<LegalNotice />} />
                  </Route>
                </Routes>
              </div>
            </UnifiedDataProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;