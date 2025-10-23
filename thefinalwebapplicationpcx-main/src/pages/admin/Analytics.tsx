import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import AdminAnalytics from './components/AdminAnalytics';

export default function Analytics() {
  return (
    <AdminRoute>
      <AdminAnalytics />
    </AdminRoute>
  );
}