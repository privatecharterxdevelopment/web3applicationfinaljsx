import React from 'react';

/**
 * Unified Button Component
 * Use this for ALL buttons across the app for consistency
 *
 * Variants:
 * - primary (default): Black background
 * - secondary: White/transparent background
 * - outline: Border only
 *
 * Sizes:
 * - sm: Small
 * - md: Medium (default)
 * - lg: Large
 */

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  // Base styles
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Variant styles
  const variantStyles = {
    primary: 'bg-black text-white hover:bg-gray-800 focus:ring-black disabled:bg-gray-300 disabled:cursor-not-allowed',
    secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed',
    outline: 'bg-transparent text-gray-900 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 disabled:bg-red-300 disabled:cursor-not-allowed',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base'
  };

  // Width
  const widthStyles = fullWidth ? 'w-full' : '';

  // Combine all styles
  const buttonClasses = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${widthStyles}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {!loading && icon && iconPosition === 'left' && icon}

      {children}

      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
}

/**
 * Icon Button - Square button with just an icon
 */
export function IconButton({
  children,
  variant = 'ghost',
  size = 'md',
  ...props
}) {
  const sizeStyles = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`!p-0 ${sizeStyles[size]}`}
      {...props}
    >
      {children}
    </Button>
  );
}

/**
 * Button Group - Multiple buttons side by side
 */
export function ButtonGroup({ children, className = '' }) {
  return (
    <div className={`inline-flex gap-2 ${className}`}>
      {children}
    </div>
  );
}
