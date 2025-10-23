import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ensureUserProfile } from '../utils/profileUtils';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  email_verified?: boolean;
  user_role?: string;
  created_at?: string;
  subscription_tier?: string;
  chat_limit?: number;
  chats_used?: number;
  referral_code?: string;
  successful_referrals?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return null instead of throwing - allows optional usage
    return null;
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    let isInitializing = false;

    const initializeAuth = async () => {
      // Prevent multiple simultaneous initializations
      if (isInitializing) {
        return;
      }

      isInitializing = true;

      try {
        if (!isMounted) return;

        console.log('🔄 Initializing AuthContext...');

        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ Error getting session:', error);
          setUser(null);
        } else if (session?.user) {
          console.log('✅ Found existing session for:', session.user.email);

          // Get user profile data
          const queryPromise = supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database query timeout')), 5000)
          );

          const { data: profile, error: profileError } = await Promise.race([
            queryPromise,
            timeoutPromise
          ]) as any;

          if (!isMounted) return;

          if (profileError) {
            console.error('❌ Error loading profile:', profileError);
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              first_name: session.user.user_metadata?.first_name,
              last_name: session.user.user_metadata?.last_name,
              email_verified: session.user.email_confirmed_at !== null,
              user_role: session.user.user_metadata?.role || 'user'
            });
          } else if (profile) {
            console.log('✅ Profile loaded successfully');
            
            // Load subscription data
            const { data: subscription } = await supabase
              .from('user_subscriptions')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            setUser({
              ...profile,
              email_verified: session.user.email_confirmed_at !== null,
              subscription_tier: subscription?.tier || 'explorer',
              chat_limit: subscription?.metadata?.chat_limit || 2,
              chats_used: subscription?.metadata?.chats_used || 0
            });
          } else {
            console.log('⚠️ No profile found, using auth data');
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              first_name: session.user.user_metadata?.first_name,
              last_name: session.user.user_metadata?.last_name,
              email_verified: session.user.email_confirmed_at !== null,
              user_role: session.user.user_metadata?.role || 'user'
            });
          }

          // Ensure user has an extended profile
          try {
            await ensureUserProfile(session.user.id);
          } catch (error) {
            console.error('Error ensuring user profile:', error);
          }
        } else {
          console.log('No active session found');
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        isInitializing = false;
        if (isMounted) {
          setInitializing(false);
          console.log('✅ AuthContext initialization complete');
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);

      if (event === 'SIGNED_IN' && session?.user) {
        // Get user profile data
        const queryPromise = supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), 5000)
        );

        const { data: profile, error: profileError } = await Promise.race([
          queryPromise,
          timeoutPromise
        ]) as any;

        if (profileError) {
          console.log('No profile found in users table, using basic user data');
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            email_verified: session.user.email_confirmed_at !== null,
            user_role: session.user.user_metadata?.role || 'user'
          });
        } else {
          setUser({
            id: profile.id,
            email: profile.email,
            first_name: profile.first_name,
            last_name: profile.last_name,
            email_verified: profile.email_verified,
            user_role: profile.user_role || 'user',
            created_at: profile.created_at
          });
        }

        // Ensure user has an extended profile
        try {
          await ensureUserProfile(session.user.id);
        } catch (error) {
          console.error('Error ensuring user profile:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      isInitializing = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ Sign in successful:', data.user.email);
        return;
      }

      throw new Error('No user returned from sign in');
    } catch (error) {
      console.error('❌ Sign in failed:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName?: string) => {
    try {
      console.log('📝 Attempting sign up for:', email);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName?.trim() || '',
            role: 'user'
          }
        }
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        throw error;
      }

      if (data.user) {
        console.log('✅ Sign up successful:', data.user.email);

        // Create user profile in users table
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert([{
              id: data.user.id,
              email: data.user.email,
              first_name: firstName.trim(),
              last_name: lastName?.trim() || null,
              email_verified: data.user.email_confirmed_at !== null,
              user_role: 'user'
            }]);

          if (profileError) {
            console.error('⚠️ Error creating user profile:', profileError);
          } else {
            console.log('✅ User profile created in users table');
          }
        } catch (profileError) {
          console.error('⚠️ User profile creation error:', profileError);
        }

        // Create extended profile in user_profiles table
        try {
          const { error: extendedProfileError } = await supabase
            .from('user_profiles')
            .insert([{
              user_id: data.user.id,
              bio: '',
              phone: '',
              address: '',
              city: '',
              country: '',
              postal_code: '',
              kyc_status: 'not_started'
            }]);

          if (extendedProfileError) {
            console.error('⚠️ Error creating extended profile:', extendedProfileError);
          } else {
            console.log('✅ Extended profile created in user_profiles table');
          }
        } catch (extendedProfileError) {
          console.error('⚠️ Extended profile creation error:', extendedProfileError);
        }

        // Create FREE subscription (Explorer tier) automatically
        try {
          const { error: subscriptionError } = await supabase
            .from('user_subscriptions')
            .insert([{
              user_id: data.user.id,
              tier: 'explorer',
              status: 'active',
              price_eur: 0,
              commission_rate: 0.20, // 20% commission for free tier
              billing_cycle: null,
              current_period_start: new Date().toISOString(),
              current_period_end: null, // No end date for free tier
              metadata: {
                chat_limit: 2,
                chats_used: 0
              }
            }]);

          if (subscriptionError) {
            console.error('⚠️ Error creating free subscription:', subscriptionError);
          } else {
            console.log('✅ FREE subscription (Explorer) created automatically');
          }
        } catch (subscriptionError) {
          console.error('⚠️ Free subscription creation error:', subscriptionError);
        }

        return;
      }

      throw new Error('No user returned from sign up');
    } catch (error) {
      console.error('❌ Sign up failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🔓 Signing out user');

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }

      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !initializing,
    isAdmin: user?.user_role === 'admin',
    initializing,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};