import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginModalNew from '../components/LoginModalNew';

export default function LoginNew() {
  const navigate = useNavigate();

  return (
    <LoginModalNew
      onClose={() => navigate('/')}
      onSwitchToRegister={() => navigate('/register')}
      onSwitchToPartnerRegister={() => navigate('/register?type=partner')}
      onSuccess={() => navigate('/dashboard')}
      onSwitchToForgotPassword={() => navigate('/reset-password')}
    />
  );
}
