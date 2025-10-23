import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

/**
 * Google Calendar OAuth Callback Handler
 * This component handles the redirect from Google after OAuth authorization
 */
const GoogleCalendarCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Connecting to Google Calendar...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get authorization code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state'); // user_id
      const error = urlParams.get('error');

      if (error) {
        throw new Error(`Google OAuth error: ${error}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      setMessage('Exchanging authorization code...');

      // Exchange code for tokens via backend
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          code,
          user_id: state,
          redirect_uri: `${window.location.origin}/auth/google/callback`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange authorization code');
      }

      const data = await response.json();

      setStatus('success');
      setMessage('Successfully connected to Google Calendar!');

      // Redirect to calendar page after 2 seconds
      setTimeout(() => {
        navigate('/?view=calendar');
      }, 2000);

    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to connect Google Calendar');

      // Redirect back to calendar page after 3 seconds
      setTimeout(() => {
        navigate('/?view=calendar');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          {status === 'processing' && (
            <>
              <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connecting...</h2>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={48} className="text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connected!</h2>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={48} className="text-red-600 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Failed</h2>
            </>
          )}

          <p className="text-gray-600">{message}</p>

          {status !== 'processing' && (
            <button
              onClick={() => navigate('/?view=calendar')}
              className="mt-6 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return to Calendar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarCallback;
