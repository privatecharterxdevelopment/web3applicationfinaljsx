import React, { useState } from 'react';
import { Mail, Check, AlertCircle, Loader2 } from 'lucide-react';
import Toast from './Toast';

interface NewsletterFormProps {
  source?: 'web' | 'wordpress';
  className?: string;
  onSuccess?: () => void;
  placeholder?: string;
  buttonText?: string;
  compact?: boolean;
}

export default function NewsletterForm({
  source = 'web',
  className = '',
  onSuccess,
  placeholder = 'Enter your email address',
  buttonText = 'Subscribe',
  compact = false
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      const response = await fetch(`${apiUrl}/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          source
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setEmail('');

        // Show success toast
        setToastMessage(data.message || 'Successfully subscribed! Check your email.');
        setToastType('success');
        setShowToast(true);

        if (onSuccess) {
          setTimeout(onSuccess, 2000);
        }

        // Reset status
        setTimeout(() => {
          setStatus('idle');
        }, 3000);
      } else {
        setStatus('error');

        // Show error toast
        setToastMessage(data.error || 'Failed to subscribe. Please try again.');
        setToastType('error');
        setShowToast(true);

        // Reset status
        setTimeout(() => {
          setStatus('idle');
        }, 3000);
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus('error');

      // Show error toast
      setToastMessage('Network error. Please try again.');
      setToastType('error');
      setShowToast(true);

      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  if (compact) {
    return (
      <>
        <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              disabled={status === 'loading' || status === 'success'}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === 'success' && <Check className="w-4 h-4" />}
            {status === 'idle' && buttonText}
            {status === 'loading' && 'Subscribing...'}
            {status === 'success' && 'Subscribed!'}
            {status === 'error' && 'Try Again'}
          </button>
        </form>

        {/* Toast */}
        {showToast && (
          <Toast
            message={toastMessage}
            type={toastType}
            onClose={() => setShowToast(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className={className}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              disabled={status === 'loading' || status === 'success'}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-black transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {status === 'loading' && (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Subscribing...</span>
              </>
            )}
            {status === 'success' && (
              <>
                <Check className="w-5 h-5" />
                <span>Subscribed!</span>
              </>
            )}
            {status === 'idle' && <span>{buttonText}</span>}
            {status === 'error' && <span>Try Again</span>}
          </button>
        </form>
      </div>

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
