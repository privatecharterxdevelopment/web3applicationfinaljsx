import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import Logo from '../Logo';

interface AuthPageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showCancelButton?: boolean;
  cancelPath?: string;
}

export default function AuthPageLayout({
  title,
  subtitle,
  children,
  showCancelButton = true,
  cancelPath = '/'
}: AuthPageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {showCancelButton && (
          <div className="absolute top-4 left-4">
            <button
              onClick={() => navigate(cancelPath)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X size={20} />
              <span>Cancel</span>
            </button>
          </div>
        )}

        <div className="flex justify-center">
          <Logo />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-gray-600">{subtitle}</p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
}