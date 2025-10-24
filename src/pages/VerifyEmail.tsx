import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthPageLayout, ErrorAlert, LoadingButton } from '../components/auth';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState('');
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmailToken(token);
    } else {
      setStatus('error');
      setMessage('No verification token provided');
      setCanResend(true);
    }
  }, [token]);

  const verifyEmailToken = async (verificationToken: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-email', {
        body: { token: verificationToken }
      });

      if (error) throw error;

      if (data?.success) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { message: 'Email verified! You can now sign in to your account.' }
          });
        }, 3000);
      } else {
        const errorMsg = data?.error || 'Verification failed';
        
        if (errorMsg.includes('expired')) {
          setStatus('expired');
          setCanResend(true);
        } else {
          setStatus('error');
        }
        
        setMessage(errorMsg);
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification. Please try again.');
      setCanResend(true);
    }
  };

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('Please enter your email address');
      return;
    }

    setIsResending(true);

    try {
      const { data, error } = await supabase.functions.invoke('resend-confirmation', {
        body: { email: email.trim() }
      });

      if (error) throw error;

      if (data?.success) {
        setMessage('Confirmation email sent! Please check your inbox.');
        setCanResend(false);
        // Re-enable resend after 5 minutes
        setTimeout(() => setCanResend(true), 5 * 60 * 1000);
      } else {
        setMessage(data?.error || 'Failed to send confirmation email');
      }
    } catch (error: any) {
      console.error('Resend email error:', error);
      setMessage('Failed to send confirmation email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Verifying your email...</h2>
            <p className="mt-2 text-gray-600">Please wait while we confirm your email address.</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Email Verified!</h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <p className="mt-4 text-sm text-gray-500">
              Redirecting to login page in 3 seconds...
            </p>
            <Link 
              to="/login" 
              className="mt-4 inline-block text-blue-600 hover:text-blue-500"
            >
              Go to Login Now
            </Link>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-amber-600" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Verification Link Expired</h2>
            <p className="mt-2 text-gray-600">{message}</p>
            
            {canResend && (
              <div className="mt-6">
                <p className="mb-4 text-sm text-gray-600">
                  Enter your email address to receive a new verification link:
                </p>
                <form onSubmit={handleResendEmail} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <LoadingButton
                    isLoading={isResending}
                    loadingText="Sending..."
                    type="submit"
                  >
                    Send New Verification Email
                  </LoadingButton>
                </form>
              </div>
            )}
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-600" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Verification Failed</h2>
            <p className="mt-2 text-gray-600">{message}</p>
            
            {canResend && (
              <div className="mt-6">
                <p className="mb-4 text-sm text-gray-600">
                  Enter your email address to receive a new verification link:
                </p>
                <form onSubmit={handleResendEmail} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <LoadingButton
                    isLoading={isResending}
                    loadingText="Sending..."
                    type="submit"
                  >
                    Send New Verification Email
                  </LoadingButton>
                </form>
              </div>
            )}
            
            <div className="mt-6">
              <Link 
                to="/register" 
                className="text-blue-600 hover:text-blue-500"
              >
                Create New Account
              </Link>
              {' | '}
              <Link 
                to="/login" 
                className="text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AuthPageLayout
      title="Email Verification"
      subtitle="Confirm your email address to activate your account"
    >
      {message && status !== 'success' && status !== 'loading' && (
        <ErrorAlert
          message={message}
          className="mb-4"
        />
      )}
      
      {renderContent()}
    </AuthPageLayout>
  );
}