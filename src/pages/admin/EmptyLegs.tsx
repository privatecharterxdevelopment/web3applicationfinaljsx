import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import EmptyLegsManagement from './components/EmptyLegsManagement';

export default function EmptyLegs() {
  return (
    <AdminRoute>
      <EmptyLegsManagement />
    </AdminRoute>
  );
}
