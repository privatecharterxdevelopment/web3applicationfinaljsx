import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import TokenizationRequestManagement from './components/TokenizationRequestManagement';

export default function Tokenization() {
  return (
    <AdminRoute>
      <TokenizationRequestManagement />
    </AdminRoute>
  );
}
