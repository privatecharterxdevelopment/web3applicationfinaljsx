import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import AdminNotifications from './components/AdminNotifications';

export default function Notifications() {
  return (
    <AdminRoute>
      <AdminNotifications />
    </AdminRoute>
  );
}
