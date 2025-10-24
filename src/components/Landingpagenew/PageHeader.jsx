import React from 'react';

/**
 * Unified Page Header Component
 * Use this for ALL page titles across Web3.0 and RWS modes
 *
 * Usage:
 * <PageHeader
 *   title="Page Title"
 *   subtitle="Optional description"
 *   action={<button>Optional Action Button</button>}
 * />
 */

export default function PageHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div>
        <h1 className="text-3xl md:text-4xl font-light text-gray-900 tracking-tighter mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-gray-600 font-light">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * Simple variant without subtitle/action
 */
export function SimplePageHeader({ title, className = '' }) {
  return (
    <h1 className={`text-3xl md:text-4xl font-light text-gray-900 tracking-tighter mb-6 ${className}`}>
      {title}
    </h1>
  );
}
