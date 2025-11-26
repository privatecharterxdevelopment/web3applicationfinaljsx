import React from 'react';
import { Check, Clock, Loader2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const PaymentStatusBadge = ({ status, size = 'default', showIcon = true }) => {
  const statusConfig = {
    pending: {
      label: 'Pending',
      icon: Clock,
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-400',
      borderColor: 'border-yellow-500/30',
      animate: false
    },
    confirming: {
      label: 'Confirming',
      icon: Loader2,
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      animate: true
    },
    paid: {
      label: 'Paid',
      icon: Check,
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      borderColor: 'border-green-500/30',
      animate: false
    },
    confirmed: {
      label: 'Confirmed',
      icon: Check,
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      borderColor: 'border-green-500/30',
      animate: false
    },
    completed: {
      label: 'Completed',
      icon: Check,
      bgColor: 'bg-emerald-500/20',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      animate: false
    },
    processing: {
      label: 'Processing',
      icon: RefreshCw,
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/30',
      animate: true
    },
    expired: {
      label: 'Expired',
      icon: XCircle,
      bgColor: 'bg-gray-500/20',
      textColor: 'text-gray-400',
      borderColor: 'border-gray-500/30',
      animate: false
    },
    cancelled: {
      label: 'Cancelled',
      icon: XCircle,
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      animate: false
    },
    failed: {
      label: 'Failed',
      icon: AlertTriangle,
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      borderColor: 'border-red-500/30',
      animate: false
    },
    refunded: {
      label: 'Refunded',
      icon: RefreshCw,
      bgColor: 'bg-orange-500/20',
      textColor: 'text-orange-400',
      borderColor: 'border-orange-500/30',
      animate: false
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs gap-1',
    default: 'px-3 py-1 text-sm gap-1.5',
    large: 'px-4 py-1.5 text-base gap-2'
  };

  const iconSizes = {
    small: 'w-3 h-3',
    default: 'w-4 h-4',
    large: 'w-5 h-5'
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && (
        <Icon
          className={`
            ${iconSizes[size]}
            ${config.animate ? 'animate-spin' : ''}
          `}
        />
      )}
      {config.label}
    </span>
  );
};

export default PaymentStatusBadge;
