import React from 'react';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface LoadingButtonProps {
  type?: 'button' | 'submit';
  isLoading: boolean;
  disabled?: boolean;
  loadingText: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary';
}

export default function LoadingButton({
  type = 'submit',
  isLoading,
  disabled = false,
  loadingText,
  children,
  onClick,
  className = '',
  icon: Icon = ArrowRight,
  variant = 'primary'
}: LoadingButtonProps) {
  const baseClasses = `w-full py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium`;
  
  const variantClasses = {
    primary: 'bg-black text-white hover:bg-gray-800',
    secondary: 'bg-white text-black border border-gray-300 hover:bg-gray-50'
  };

  return (
    <button
      type={type}
      disabled={isLoading || disabled}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-current border-opacity-30 border-t-current rounded-full animate-spin" />
          <span className="font-light">{loadingText}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          <Icon size={18} />
        </>
      )}
    </button>
  );
}