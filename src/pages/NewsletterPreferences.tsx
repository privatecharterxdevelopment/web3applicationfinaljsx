import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mail, Check, X, Loader2, AlertCircle, Settings } from 'lucide-react';

interface Preferences {
  emptyLegs: boolean;
  luxuryCars: boolean;
  adventures: boolean;
  generalUpdates: boolean;
}

export default function NewsletterPreferences() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'active' | 'unsubscribed'>('active');
  const [preferences, setPreferences] = useState<Preferences>({
    emptyLegs: true,
    luxuryCars: true,
    adventures: true,
    generalUpdates: true
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessageType('error');
      setMessage('Invalid or missing token');
      return;
    }

    fetchPreferences();
  }, [token]);

  const fetchPreferences = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

      const response = await fetch(`${apiUrl}/newsletter/preferences?token=${token}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setEmail(data.email);
        setStatus(data.status);
        setPreferences(data.preferences);
      } else {
        setMessageType('error');
        setMessage(data.error || 'Failed to load preferences');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setMessageType('error');
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage('');

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

      const response = await fetch(`${apiUrl}/newsletter/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          preferences
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessageType('success');
        setMessage('Preferences updated successfully!');

        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessageType('error');
        setMessage(data.error || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessageType('error');
      setMessage('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!confirm('Are you sure you want to unsubscribe from all emails?')) {
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

      const response = await fetch(`${apiUrl}/newsletter/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('unsubscribed');
        setMessageType('success');
        setMessage('You have been unsubscribed successfully.');
      } else {
        setMessageType('error');
        setMessage(data.error || 'Failed to unsubscribe');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setMessageType('error');
      setMessage('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof Preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-900" />
          <p className="text-gray-600">Loading preferences...</p>
        </div>
      </div>
    );
  }

  if (!token || (message && messageType === 'error' && !email)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-light text-gray-900">Invalid Link</h1>
            <p className="text-gray-600">{message || 'This preference link is invalid or has expired.'}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unsubscribed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-light text-gray-900">Unsubscribed</h1>
            <p className="text-gray-600">
              You have been successfully unsubscribed from our newsletter.
            </p>
            <p className="text-sm text-gray-500">
              Email: <span className="font-medium">{email}</span>
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 px-8 py-6">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-white" />
            <div>
              <h1 className="text-2xl font-light text-white">Newsletter Preferences</h1>
              <p className="text-sm text-gray-300 mt-1">{email}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Status Message */}
          {message && (
            <div
              className={`mb-6 flex items-start gap-2 p-4 rounded-lg ${
                messageType === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {messageType === 'success' ? (
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p>{message}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Email Preferences</h2>
              <p className="text-sm text-gray-600">
                Choose which types of emails you'd like to receive from PrivateCharterX.
              </p>
            </div>

            {/* Preference Toggles */}
            <div className="space-y-4">
              {/* Empty Legs */}
              <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <input
                  type="checkbox"
                  checked={preferences.emptyLegs}
                  onChange={() => togglePreference('emptyLegs')}
                  className="mt-1 w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Empty Leg Deals</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Exclusive private jet empty leg offers with up to 75% savings
                  </p>
                </div>
              </label>

              {/* Luxury Cars */}
              <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <input
                  type="checkbox"
                  checked={preferences.luxuryCars}
                  onChange={() => togglePreference('luxuryCars')}
                  className="mt-1 w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Luxury Car Offers</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Premium ground transportation and luxury car service updates
                  </p>
                </div>
              </label>

              {/* Adventures */}
              <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <input
                  type="checkbox"
                  checked={preferences.adventures}
                  onChange={() => togglePreference('adventures')}
                  className="mt-1 w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Adventure Packages</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Exclusive adventure tours and exotic travel experiences
                  </p>
                </div>
              </label>

              {/* General Updates */}
              <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <input
                  type="checkbox"
                  checked={preferences.generalUpdates}
                  onChange={() => togglePreference('generalUpdates')}
                  className="mt-1 w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">General Updates</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Platform news, Web3 innovations, and tokenization updates
                  </p>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleSavePreferences}
                disabled={saving}
                className="flex-1 bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-black transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Save Preferences</span>
                  </>
                )}
              </button>

              <button
                onClick={handleUnsubscribe}
                disabled={saving}
                className="px-6 py-3 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                <span>Unsubscribe All</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
