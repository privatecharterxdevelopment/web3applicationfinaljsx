import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import KYCVerificationManagement from './components/KYCVerificationManagement';

export default function KYCVerification() {
  return (
    <AdminRoute>
      <KYCVerificationManagement />
    </AdminRoute>
  );
}