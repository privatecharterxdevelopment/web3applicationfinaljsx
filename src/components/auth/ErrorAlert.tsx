import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  className?: string;
  additional?: React.ReactNode;
}

export default function ErrorAlert({ 
  title = "Error", 
  message, 
  className = "",
  additional
}: ErrorAlertProps) {
  return (
    <div className={`bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 ${className}`}>
      <AlertTriangle size={16} className="flex-shrink-0" />
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm">{message}</div>
        {additional}
      </div>
    </div>
  );
}