import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterModalNew from '../components/RegisterModalNew';

export default function RegisterNew() {
  const navigate = useNavigate();

  return (
    <RegisterModalNew
      onClose={() => navigate('/')}
      onSwitchToLogin={() => navigate('/login')}
      onSuccess={() => navigate('/dashboard')}
    />
  );
}
