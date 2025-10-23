import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import UserRequestManagement from './components/UserRequestManagement';

export default function UserRequests() {
  return (
    <AdminRoute>
      <UserRequestManagement />
    </AdminRoute>
  );
}