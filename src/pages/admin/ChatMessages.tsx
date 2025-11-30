import React from 'react';
import AdminRoute from '../../components/AdminRoute';
import ChatMessagesManagement from './components/ChatMessagesManagement';

export default function ChatMessages() {
  return (
    <AdminRoute>
      <ChatMessagesManagement />
    </AdminRoute>
  );
}
