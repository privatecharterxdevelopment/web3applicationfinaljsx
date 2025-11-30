import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import UserBookingsManagement from './components/UserBookingsManagement';

export default function Bookings() {
  return (
    <AdminRoute>
      <UserBookingsManagement />
    </AdminRoute>
  );
}
