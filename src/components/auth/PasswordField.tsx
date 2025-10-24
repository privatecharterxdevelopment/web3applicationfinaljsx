import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import FormField from './FormField';

interface PasswordFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  autoComplete?: string;
  minLength?: number;
  showStrengthIndicator?: boolean;
  className?: string;
}

interface PasswordRequirement {
  test: boolean;
  label: string;
}

export default function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  autoComplete,
  minLength,
  showStrengthIndicator = false,
  className = ''
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (password: string): PasswordRequirement[] => {
    return [
      { test: password.length >= 8, label: 'At least 8 characters' },
      { test: /[A-Z]/.test(password), label: 'One uppercase letter' },
      { test: /[a-z]/.test(password), label: 'One lowercase letter' },
      { test: /\d/.test(password), label: 'One number' },
      { test: /[^a-zA-Z0-9]/.test(password), label: 'One special character' }
    ];
  };

  const passwordRequirements = showStrengthIndicator ? getPasswordStrength(value) : [];

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const rightElement = (
    <button
      type="button"
      onClick={togglePasswordVisibility}
      disabled={disabled}
      className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className={className}>
      <FormField
        label={label}
        type={showPassword ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        icon={Lock}
        required={required}
        disabled={disabled}
        error={error}
        autoComplete={autoComplete}
        minLength={minLength}
        rightElement={rightElement}
      />

      {/* Password strength indicator */}
      {showStrengthIndicator && value && passwordRequirements.length > 0 && (
        <div className="mt-2 space-y-1">
          {passwordRequirements.map((req, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${req.test ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={req.test ? 'text-green-600' : 'text-gray-500'}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}