import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  onClick?: () => void;
  useLink?: boolean;
}

export default function Logo({ className = '', onClick, useLink = true }: LogoProps) {
  const logoContent = (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-2">
        {/* Airplane Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
          <svg
            className="w-7 h-7 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
        {/* Text Logo */}
        <div className="flex flex-col">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            PrivateCharter
          </div>
          <div className="text-sm font-medium text-blue-600 -mt-1">
            X
          </div>
        </div>
      </div>
    </div>
  );

  if (useLink) {
    return (
      <Link to="/" className="relative flex items-center gap-2 pl-1 sm:pl-2 md:pl-6" onClick={onClick}>
        {logoContent}
      </Link>
    );
  }

  return (
    <div className="relative flex items-center gap-2 pl-1 sm:pl-2 md:pl-6" onClick={onClick}>
      {logoContent}
    </div>
  );
}