import React from 'react';
import { useNavigate } from 'react-router-dom';
import EnhancedDashboard from '../components/Dashboard/EnhancedDashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  
  const handleNavigate = (route) => {
    switch (route) {
      case 'create-invoice':
        navigate('/invoices/new');
        break;
      case 'invoices':
        navigate('/invoices');
        break;
      case 'clients':
        navigate('/clients');
        break;
      case 'reports':
        navigate('/reports');
        break;
      default:
        navigate(`/${route}`);
    }
  };

  return <EnhancedDashboard onNavigate={handleNavigate} />;
};

export default Dashboard;