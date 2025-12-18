import React from 'react';
import { AuthProvider as CRMAuthProvider } from '../contexts/CRM/AuthContext';
import { NotificationProvider } from '../contexts/CRM/NotificationContext';
import CRMApp from '../components/CRM/App';

// CRM Page wrapper - provides authentication and notification contexts for the CRM system
export default function CRMPage() {
  return (
    <CRMAuthProvider>
      <NotificationProvider>
        <CRMApp />
      </NotificationProvider>
    </CRMAuthProvider>
  );
}
