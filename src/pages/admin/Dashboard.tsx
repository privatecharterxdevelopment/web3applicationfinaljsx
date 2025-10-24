import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import AdminDashboard from './components/AdminDashboard';

export default function Dashboard() {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
}