import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import CO2CertificateManagement from './components/CO2CertificateManagement';

export default function CO2Certificates() {
  return (
    <AdminRoute>
      <CO2CertificateManagement />
    </AdminRoute>
  );
}