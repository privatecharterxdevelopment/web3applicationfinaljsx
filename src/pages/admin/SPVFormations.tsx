import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import SPVFormationManagement from './components/SPVFormationManagement';

export default function SPVFormations() {
  return (
    <AdminRoute>
      <SPVFormationManagement />
    </AdminRoute>
  );
}
