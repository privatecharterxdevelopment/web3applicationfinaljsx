import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import CRMDashboard from '../components/CRMDashboard';

// CRM Page wrapper - complete standalone CRM system
export default function CRMPage() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/dashboard');
  };

  return (
    <AuthProvider>
      <CRMDashboard onClose={handleClose} />
    </AuthProvider>
  );
}
