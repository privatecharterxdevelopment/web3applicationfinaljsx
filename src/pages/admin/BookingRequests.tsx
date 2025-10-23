import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import BookingRequestManagement from './components/BookingRequestManagement';

export default function BookingRequests() {
  return (
    <AdminRoute>
      <BookingRequestManagement />
    </AdminRoute>
  );
}