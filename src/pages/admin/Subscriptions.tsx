import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import SubscriptionsManagement from './components/SubscriptionsManagement';

export default function Subscriptions() {
  return (
    <AdminRoute>
      <SubscriptionsManagement />
    </AdminRoute>
  );
}
