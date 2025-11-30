import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import SupportTicketsManagement from './components/SupportTicketsManagement';

export default function SupportTickets() {
  return (
    <AdminRoute>
      <SupportTicketsManagement />
    </AdminRoute>
  );
}
