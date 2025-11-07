import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { UnifiedDataProvider } from './contexts/UnifiedDataContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import Layout from './components/Layout';
import Login from './pages/Login';
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
import Refund from './pages/Refund';
import PaddlePricing from './pages/PaddlePricing';
import UpgradePage from './components/UpgradePage';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';



function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider>
          <UnifiedDataProvider>
            <div className="App">
              <Toaster position="top-right" />
              <Routes>
                <Route path="/login" element={<Login />} />
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
                  <Route path="upgrade" element={<UpgradePage />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="terms" element={<Terms />} />
                  <Route path="privacy" element={<Privacy />} />
                  <Route path="refund" element={<Refund />} />
                </Route>
              </Routes>
            </div>
          </UnifiedDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;