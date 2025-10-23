import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormFieldProps {
  label: string;
  type: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: LucideIcon;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  autoComplete?: string;
  minLength?: number;
  rightElement?: React.ReactNode;
  className?: string;
}

export default function FormField({
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = false,
  disabled = false,
  error,
  autoComplete,
  minLength,
  rightElement,
  className = ''
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <Icon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          minLength={minLength}
          autoComplete={autoComplete}
          className={`w-full pl-10 ${rightElement ? 'pr-10' : 'pr-4'} py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-red-300 bg-red-50' : ''
          }`}
          placeholder={placeholder}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}