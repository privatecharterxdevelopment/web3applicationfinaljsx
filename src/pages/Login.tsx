import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AuthPageLayout, FormField, PasswordField, ErrorAlert, LoadingButton, SuccessModal } from '../components/auth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      setAttempts(prev => prev + 1);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      if (data.user) {
        // Check if user exists in our users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id);

        if (userError && userError.code !== 'PGRST116') {
          console.error('Error checking user:', userError);
        }

        // If user doesn't exist, create them
        if (!userData || userData.length === 0) {
          const { error: createError } = await supabase
            .from('users')
            .insert([{
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
              email_verified: data.user.email_confirmed_at ? true : false,
              is_admin: false,
              user_role: 'user'
            }]);

          if (createError) console.error('Error creating user:', createError);
        }

        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);

        setShowSuccess(true);
        
        setTimeout(() => {
          setShowSuccess(false);
          // Clear form and redirect to dashboard
          setEmail('');
          setPassword('');
          setError(null);
          setAttempts(0);
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(`Invalid email or password. Please try again. (Attempt ${attempts + 1})`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout
      title="Sign in to your account"
      subtitle="Welcome back to PrivateCharterX"
    >
      {error && (
        <ErrorAlert
          title="Login Failed"
          message={error}
          className="mb-4"
          additional={
            attempts > 1 && (
              <div className="text-xs mt-1 opacity-75">
                You can keep trying with the correct credentials.
              </div>
            )
          }
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField
          label="Email Address"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          icon={Mail}
          required
          disabled={isLoading}
          autoComplete="email"
        />

        <PasswordField
          label="Password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          disabled={isLoading}
          autoComplete="current-password"
        />

        {error && (
          <div className="text-center text-sm text-gray-600">
            Double-check your email and password, then try again.
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link to="/register" className="font-medium text-black hover:text-gray-800">
              Create an account
            </Link>
          </div>
        </div>

        <LoadingButton
          isLoading={isLoading}
          disabled={!email.trim() || !password}
          loadingText="Signing in..."
        >
          Sign In
        </LoadingButton>
      </form>

      <SuccessModal
        show={showSuccess}
        title="Login Successful!"
        message="Welcome back to PrivateCharterX. You are now logged in."
      />
    </AuthPageLayout>
  );
}