import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import CardApplicationsManagement from './components/CardApplicationsManagement';

export default function CardApplications() {
  return (
    <AdminRoute>
      <CardApplicationsManagement />
    </AdminRoute>
  );
}
