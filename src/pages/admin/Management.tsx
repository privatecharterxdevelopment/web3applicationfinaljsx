import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import AdminManagement from './components/AdminManagement';

export default function Management() {
  return (
    <AdminRoute>
      <AdminManagement />
    </AdminRoute>
  );
}