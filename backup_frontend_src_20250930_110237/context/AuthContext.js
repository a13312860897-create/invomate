import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import clientService from '../services/clientService';
import { useTranslation } from 'react-i18next';

// Development mode flag for testing
const DEV_MODE = false; // Set to false to use real backend API

// Mock data storage for development mode with localStorage persistence
const getMockData = () => {
  const stored = localStorage.getItem('mockAppData');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse stored mock data:', e);
    }
  }
  return {
    clients: [],
    invoices: [],
    nextClientId: 1,
    nextInvoiceId: 1
  };
};

const saveMockData = (data) => {
  try {
    localStorage.setItem('mockAppData', JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save mock data:', e);
  }
};

let mockData = getMockData();
let mockClients = mockData.clients;
let mockInvoices = mockData.invoices;
let nextClientId = mockData.nextClientId;
let nextInvoiceId = mockData.nextInvoiceId;

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const { t } = useTranslation();
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(t('auth:useAuthMustBeUsedWithinAuthProvider'));
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);
  
  // Initialize clientService with the appropriate API instance
  useEffect(() => {
    if (DEV_MODE) {
      clientService.setApi(mockApi);
    } else {
      // In production mode, don't inject API instance, let clientService use direct fetch
      // This ensures it uses the real backend API with proper authentication
      clientService.setApi(null);
    }
  }, []);
  
  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Development mode: auto-login with default user
        if (DEV_MODE) {
          // Set mock token in localStorage for development mode
          localStorage.setItem('token', 'dev-mock-token');
          api.defaults.headers.common['Authorization'] = `Bearer dev-mock-token`;
          
          setUser({
            id: 'dev-user-id',
            name: t('auth:devUser'),
            email: 'dev@example.com',
            role: 'admin',
            nationality: 'US',
            currency: 'EUR',
            language: 'en',
            invoiceMode: 'intl'
          });
          return;
        }
        
        // For now, use dev-mock-token to connect to backend API
        const token = localStorage.getItem('token') || 'dev-mock-token';
        localStorage.setItem('token', 'dev-mock-token');
        api.defaults.headers.common['Authorization'] = `Bearer dev-mock-token`;
        
        setUser({
          id: 1,
          name: 'Test User',
          email: 'dev@example.com',
          role: 'admin',
          nationality: 'FR',
          currency: 'EUR',
          language: 'fr',
          invoiceMode: 'french'
        });
      } catch (error) {
        console.error(t('auth:checkError'), error);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      
      // Development mode: skip actual API call
      if (DEV_MODE) {
        // Set mock token in localStorage for development mode
        localStorage.setItem('token', 'dev-mock-token');
        api.defaults.headers.common['Authorization'] = `Bearer dev-mock-token`;
        
        const user = {
          id: 'dev-user-id',
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email || 'dev@example.com',
          role: 'admin',
          nationality: userData.nationality || 'US',
          currency: userData.currency || 'EUR',
          language: userData.language || 'en',
          invoiceMode: userData.invoiceMode || 'intl',
          companyName: userData.companyName || '',
          phone: userData.phone || ''
        };
        
        // Set user in state
        setUser(user);
        
        toast.success(t('auth:devRegisterSuccess'));
        return { success: true, shouldRedirect: true };
      }
      
      const response = await api.post('/auth/register', userData);
      
      const { user, token } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user in state
      setUser(user);
      
      toast.success(t('auth:registerSuccess'));
      return { success: true, shouldRedirect: true };
    } catch (error) {
      const message = error.response?.data?.message || t('auth:registerFailed');
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };
  
  // Login function
  const login = async (email, password, invoiceMode = 'intl') => {
    try {
      setLoading(true);
      
      // Development mode: skip actual API call
      if (DEV_MODE) {
        // Set mock token in localStorage for development mode
        localStorage.setItem('token', 'dev-mock-token');
        api.defaults.headers.common['Authorization'] = `Bearer dev-mock-token`;
        
        const user = {
          id: 'dev-user-id',
          name: t('auth:devUser'),
          email: email || 'dev@example.com',
          role: 'admin',
          nationality: invoiceMode === 'fr' ? 'FR' : 'US',
        currency: invoiceMode === 'fr' ? 'EUR' : 'EUR',
        language: invoiceMode === 'fr' ? 'fr' : 'en',
          invoiceMode: invoiceMode,
          companyName: '',
          phone: ''
        };
        
        // Set user in state
        setUser(user);
        
        toast.success(t('auth:devLoginSuccess'));
        return { success: true, shouldRedirect: true };
      }
      
      const response = await api.post('/auth/login', { email, password, invoiceMode });
      
      const { user, token } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set axios default headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user in state
      setUser(user);
      
      toast.success(t('auth:loginSuccess'));
      return { success: true, shouldRedirect: true };
    } catch (error) {
      const message = error.response?.data?.message || t('auth:loginFailed');
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Remove axios default headers
    delete api.defaults.headers.common['Authorization'];
    
    // Set user to null
    setUser(null);
    
    toast.success(t('auth:logoutSuccess'));
  };
  
  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      const response = await api.put('/settings/profile', profileData);
      
      // Update user in state
      setUser(response.data.data);
      
      toast.success(t('auth:profileUpdateSuccess'));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || t('auth:profileUpdateFailed');
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };
  
  // Update user function for updating user data without API call
  const updateUser = (userData) => {
    setUser(userData);
  };
  
  // API object for making authenticated requests
  const mockApi = {
    get: async (url) => {
      if (DEV_MODE) {
        // Mock API responses in development mode
        if (url === '/clients') {
          return { data: [...mockClients] };
        } else if (url === '/invoices') {
          // Ensure all invoices have complete client info
          const invoicesWithClientInfo = mockInvoices.map(invoice => {
            if (invoice.clientId && !invoice.client) {
              const client = mockClients.find(c => c.id === invoice.clientId);
              return { ...invoice, client };
            }
            return invoice;
          });
          return { data: invoicesWithClientInfo };
        } else if (url === '/dashboard') {
          // Mock dashboard data
          return { 
            data: {
              todayRevenue: {
                paid: 1250.00,
                due: 750.50,
                total: 2000.50
              },
              overdueInvoices: [
                {
                  id: 'inv-001',
                  invoiceNumber: 'INV-001',
                  clientName: t('auth:testClientA'),
                  total: 500.00,
                  currency: 'EUR',
                  dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                  daysOverdue: 5
                },
                {
                  id: 'inv-002',
                  invoiceNumber: 'INV-002',
                  clientName: t('auth:testClientB'),
                  total: 300.00,
                  currency: 'EUR',
                  dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                  daysOverdue: 3
                }
              ],
              recentInvoices: [
                {
                  id: 'inv-003',
                  invoiceNumber: 'INV-003',
                  clientName: t('auth:testClientC'),
                  total: 800.00,
                  currency: 'EUR',
                  status: 'paid',
                  issueDate: new Date().toISOString(),
                  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                  id: 'inv-004',
                  invoiceNumber: 'INV-004',
                  clientName: t('auth:testClientD'),
                  total: 450.00,
                  currency: 'EUR',
                  status: 'sent',
                  issueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                  dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
                }
              ]
            }
          };
        } else if (url.startsWith('/clients/')) {
          const clientId = url.split('/')[2];
          const client = mockClients.find(c => c.id === clientId);
          return { data: client || { id: clientId, name: t('auth:testClient'), vatNumber: 'FR12345678901', siren: '123456789', siret: '12345678901234' } };
        } else if (url.startsWith('/invoices/')) {
          const invoiceId = url.split('/')[2];
          const invoice = mockInvoices.find(i => i.id === invoiceId);
          
          // If invoice exists but doesn't have complete client info, find the client
          if (invoice && invoice.clientId && !invoice.client) {
            const client = mockClients.find(c => c.id === invoice.clientId);
            if (client) {
              invoice.client = client;
            }
          }
          
          return { data: invoice || { id: invoiceId, amount: 100, status: 'pending', date: new Date().toISOString() } };
        }
        return { data: {} };
      }
      return api.get(url);
    },
    post: async (url, data) => {
      if (DEV_MODE) {
        // Mock API responses in development mode
        if (url === '/clients') {
          const newClient = {
            ...data,
            id: `client-${nextClientId++}`
          };
          mockClients.push(newClient);
          // Save to localStorage
          saveMockData({
            clients: mockClients,
            invoices: mockInvoices,
            nextClientId,
            nextInvoiceId
          });
          return { data: { message: t('auth:clientCreatedSuccess'), data: newClient } };
        } else if (url === '/invoices') {
          // find the client by id
          const client = mockClients.find(c => c.id === data.clientId);
          const newInvoice = {
            ...data,
            id: `invoice-${nextInvoiceId++}`,
            invoiceNumber: `INV-${String(nextInvoiceId).padStart(3, '0')}`,
            client: client,
            createdAt: new Date().toISOString()
          };
          mockInvoices.push(newInvoice);
          // Save to localStorage
          saveMockData({
            clients: mockClients,
            invoices: mockInvoices,
            nextClientId,
            nextInvoiceId
          });
          return { data: { message: t('auth:invoiceCreatedSuccess'), invoice: newInvoice } };
        }
        return { data: { message: t('auth:success') } };
      }
      return api.post(url, data);
    },
    put: async (url, data) => {
      if (DEV_MODE) {
        // Mock API responses in development mode
        if (url.startsWith('/clients/')) {
          const clientId = url.split('/')[2];
          const index = mockClients.findIndex(c => c.id === clientId);
          if (index !== -1) {
            mockClients[index] = { ...mockClients[index], ...data };
            // Save to localStorage
            saveMockData({
              clients: mockClients,
              invoices: mockInvoices,
              nextClientId,
              nextInvoiceId
            });
            return { data: { message: t('auth:clientUpdatedSuccess'), data: mockClients[index] } };
          }
        } else if (url.startsWith('/invoices/')) {
          const invoiceId = url.split('/')[2];
          const index = mockInvoices.findIndex(i => i.id === invoiceId);
          if (index !== -1) {
            mockInvoices[index] = { ...mockInvoices[index], ...data };
            return { data: { message: t('auth:invoiceUpdatedSuccess'), invoice: mockInvoices[index] } };
          }
        }
        return { data: { message: t('auth:success') } };
      }
      return api.put(url, data);
    },
    delete: async (url) => {
      if (DEV_MODE) {
        // Mock API responses in development mode
        if (url.startsWith('/clients/')) {
          const clientId = url.split('/')[2];
          const index = mockClients.findIndex(c => c.id === clientId);
          if (index !== -1) {
            mockClients.splice(index, 1);
            // Save to localStorage
            saveMockData({
              clients: mockClients,
              invoices: mockInvoices,
              nextClientId,
              nextInvoiceId
            });
            return { data: { message: t('auth:clientDeletedSuccess') } };
          }
        } else if (url.startsWith('/invoices/')) {
          const invoiceId = url.split('/')[2];
          const index = mockInvoices.findIndex(i => i.id === invoiceId);
          if (index !== -1) {
            mockInvoices.splice(index, 1);
            return { data: { message: t('auth:invoiceDeletedSuccess') } };
          }
        }
        return { data: { message: t('auth:success') } };
      }
      return api.delete(url);
    }
  };

  // Add a function to handle login/registration redirects
  const handleAuthRedirect = () => {
    const redirectPath = localStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      // Clear the saved redirect path
      localStorage.removeItem('redirectAfterLogin');
      // Return the redirect path to be used by the caller
      return redirectPath;
    }
    return null;
  };

  // Add a function to save the current path for redirect after login
  const saveRedirectPath = (path) => {
    localStorage.setItem('redirectAfterLogin', path);
  };

  // Value object to be provided to consumers
  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateUser,
    handleAuthRedirect,
    saveRedirectPath,
    api: DEV_MODE ? mockApi : api,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isPremium: user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing'
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};