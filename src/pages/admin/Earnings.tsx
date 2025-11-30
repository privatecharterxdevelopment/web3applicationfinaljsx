import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import EarningsDashboard from './components/EarningsDashboard';

export default function Earnings() {
  return (
    <AdminRoute>
      <EarningsDashboard />
    </AdminRoute>
  );
}
