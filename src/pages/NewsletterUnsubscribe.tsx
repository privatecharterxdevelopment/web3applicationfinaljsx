import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, Check, X, Loader2, AlertCircle } from 'lucide-react';

export default function NewsletterUnsubscribe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'confirm' | 'success' | 'error'>('confirm');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing token');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      const response = await fetch(`${apiUrl}/newsletter/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setEmail(data.email);
        setMessage(data.message || 'You have been unsubscribed successfully.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to unsubscribe. Please try again.');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      setStatus('error');
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Confirmation View
  if (status === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-light text-gray-900">Unsubscribe from Newsletter?</h1>
            <p className="text-gray-600">
              Are you sure you want to unsubscribe from the PrivateCharterX newsletter? You'll no longer receive:
            </p>
            <ul className="text-left text-sm text-gray-600 space-y-2 w-full">
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-gray-400" />
                <span>Exclusive empty leg flight deals</span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-gray-400" />
                <span>Premium luxury car offers</span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-gray-400" />
                <span>Adventure package updates</span>
              </li>
              <li className="flex items-center gap-2">
                <X className="w-4 h-4 text-gray-400" />
                <span>Web3 and platform innovations</span>
              </li>
            </ul>

            <div className="flex flex-col w-full gap-3 mt-4">
              <button
                onClick={handleUnsubscribe}
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Unsubscribing...</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5" />
                    <span>Yes, Unsubscribe</span>
                  </>
                )}
              </button>

              <Link
                to={`/newsletter/preferences?token=${token}`}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-center"
              >
                Manage Preferences Instead
              </Link>

              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success View
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-light text-gray-900">Unsubscribed Successfully</h1>
            <p className="text-gray-600">{message}</p>
            {email && (
              <p className="text-sm text-gray-500">
                Email: <span className="font-medium">{email}</span>
              </p>
            )}
            <div className="flex flex-col w-full gap-3 mt-4">
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-black transition-colors"
              >
                Go to Homepage
              </button>
              <p className="text-xs text-gray-500">
                Changed your mind?{' '}
                <Link
                  to={`/newsletter/preferences?token=${token}`}
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  Manage your preferences
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error View
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-light text-gray-900">Unsubscribe Failed</h1>
          <p className="text-gray-600">{message}</p>
          <div className="flex flex-col w-full gap-3 mt-4">
            <button
              onClick={() => setStatus('confirm')}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-black transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
