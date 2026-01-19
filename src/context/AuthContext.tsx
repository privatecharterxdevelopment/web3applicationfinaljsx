import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ensureUserProfile } from '../utils/profileUtils';
import { handleOAuthUser } from '../utils/oauthUserHandler';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  email_verified?: boolean;
  user_role?: string; // 'user' | 'partner' | 'admin'
  created_at?: string;
  subscription_tier?: string;
  chat_limit?: number;
  chats_used?: number;
  referral_code?: string;
  successful_referrals?: number;
  // Partner-specific fields
  partner_type?: 'auto' | 'taxi' | 'adventure' | 'limousine' | 'other';
  company_name?: string;
  payment_method?: 'iban' | 'wallet';
  iban?: string;
  wallet_address?: string;
  stripe_account_id?: string;
  partner_verified?: boolean;
}

interface SignInOptions {
  captchaToken?: string;
}

interface SignUpOptions {
  captchaToken?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  initializing: boolean;
  signIn: (email: string, password: string, options?: SignInOptions) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName?: string, options?: SignUpOptions) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
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

        // Check for OAuth code in URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
          console.log('🔑 OAuth code detected in URL, exchanging for session...');

          // Exchange the code for a session explicitly
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('❌ Code exchange failed:', exchangeError.message);
            // Check if it's a PKCE verifier issue
            if (exchangeError.message.includes('code verifier')) {
              console.error('💡 PKCE code verifier missing - this happens when the OAuth was started from a different domain or browser session');
            }
          } else if (data.session) {
            console.log('✅ Code exchanged successfully, session established for:', data.session.user?.email);
          }

          // Clean up URL regardless of success/failure
          const newUrl = window.location.pathname + window.location.hash;
          window.history.replaceState({}, '', newUrl);
        }

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
            setTimeout(() => reject(new Error('Database query timeout')), 2000)
          );

          const { data: profile, error: profileError } = await Promise.race([
            queryPromise,
            timeoutPromise
          ]) as any;

          if (!isMounted) return;

          if (profileError) {
            console.error('❌ Error loading profile (non-blocking):', profileError.message || 'timeout');
            // Extract name from Google OAuth metadata (full_name or name)
            const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
            const firstName = session.user.user_metadata?.given_name || fullName.split(' ')[0] || '';
            const lastName = session.user.user_metadata?.family_name || fullName.split(' ').slice(1).join(' ') || '';

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              first_name: firstName,
              last_name: lastName,
              email_verified: session.user.email_confirmed_at !== null,
              user_role: session.user.user_metadata?.role || 'user',
              created_at: session.user.created_at
            });
          } else if (profile) {
            console.log('✅ Profile loaded successfully');

            // Load subscription data from user_profiles table (single source of truth)
            const subQueryPromise = supabase
              .from('user_profiles')
              .select('subscription_tier, subscription_status, chats_limit, chats_used')
              .eq('user_id', session.user.id)
              .single();

            const subTimeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Subscription query timeout')), 2000)
            );

            const { data: userProfile } = await Promise.race([
              subQueryPromise,
              subTimeoutPromise
            ]).catch(err => {
              console.error('❌ User profile subscription query failed (non-blocking):', err.message);
              return { data: null };
            }) as any;

            setUser({
              ...profile,
              email_verified: session.user.email_confirmed_at !== null,
              subscription_tier: userProfile?.subscription_tier || null,
              chat_limit: userProfile?.chats_limit ?? 1,
              chats_used: userProfile?.chats_used || 0
            });
          } else {
            console.log('⚠️ No profile found, using auth data');
            // Extract name from Google OAuth metadata (full_name or name)
            const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
            const firstName = session.user.user_metadata?.given_name || fullName.split(' ')[0] || '';
            const lastName = session.user.user_metadata?.family_name || fullName.split(' ').slice(1).join(' ') || '';

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              first_name: firstName,
              last_name: lastName,
              email_verified: session.user.email_confirmed_at !== null,
              user_role: session.user.user_metadata?.role || 'user',
              created_at: session.user.created_at
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
        // Check if this is an OAuth login (Google, Apple, etc.)
        const provider = session.user.app_metadata?.provider;
        const isOAuthLogin = provider && provider !== 'email';

        if (isOAuthLogin) {
          console.log('🔑 OAuth login detected, provider:', provider);
          // Handle OAuth user - ensure they have entries in users and user_profiles tables
          await handleOAuthUser(
            session.user.id,
            session.user.email || '',
            session.user.user_metadata || {}
          );
        }

        // Get user profile data WITH 2-SECOND TIMEOUT
        const queryPromise = supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), 2000)
        );

        const { data: profile, error: profileError } = await Promise.race([
          queryPromise,
          timeoutPromise
        ]) as any;

        // Extract name from Google metadata as fallback
        const fullName = session.user.user_metadata?.full_name ||
                        session.user.user_metadata?.name ||
                        '';
        const metaFirstName = session.user.user_metadata?.given_name ||
                             fullName.split(' ')[0] ||
                             '';
        const metaLastName = session.user.user_metadata?.family_name ||
                            fullName.split(' ').slice(1).join(' ') ||
                            '';

        if (profileError || !profile) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            first_name: metaFirstName || 'User',
            last_name: metaLastName || '',
            email_verified: session.user.email_confirmed_at !== null,
            user_role: session.user.user_metadata?.role || 'user'
          });
        } else {
          // Also load subscription data from user_profiles on sign-in
          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('subscription_tier, subscription_status, chats_limit, chats_used')
            .eq('user_id', session.user.id)
            .single();

          setUser({
            id: profile.id,
            email: profile.email,
            first_name: profile.first_name || metaFirstName,
            last_name: profile.last_name || metaLastName,
            email_verified: profile.email_verified,
            user_role: profile.user_role || 'user',
            created_at: profile.created_at,
            subscription_tier: userProfile?.subscription_tier || null,
            chat_limit: userProfile?.chats_limit ?? 1,
            chats_used: userProfile?.chats_used || 0
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

    // Set up real-time subscription for user_profiles changes
    // This will automatically update UI when admin changes subscription or user upgrades via Stripe
    let profileSubscription: any = null;

    const setupProfileSubscription = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        profileSubscription = supabase
          .channel('user_profiles_changes')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'user_profiles',
              filter: `user_id=eq.${session.user.id}`
            },
            (payload) => {
              console.log('📡 Real-time subscription update received:', payload.new);
              const newProfile = payload.new as any;
              setUser(prev => prev ? {
                ...prev,
                subscription_tier: newProfile.subscription_tier || null,
                chat_limit: newProfile.chats_limit ?? 1,
                chats_used: newProfile.chats_used || 0
              } : null);
            }
          )
          .subscribe();
      }
    };

    setupProfileSubscription();

    return () => {
      isMounted = false;
      isInitializing = false;
      subscription.unsubscribe();
      if (profileSubscription) {
        supabase.removeChannel(profileSubscription);
      }
    };
  }, []);

  const signIn = async (email: string, password: string, options?: SignInOptions) => {
    try {
      console.log('🔐 Attempting sign in for:', email);

      const signInOptions: any = {
        email: email.trim(),
        password
      };

      // Add captcha token if provided (for Supabase CAPTCHA verification)
      if (options?.captchaToken) {
        signInOptions.options = {
          captchaToken: options.captchaToken
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword(signInOptions);

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

  const signUp = async (email: string, password: string, firstName: string, lastName?: string, options?: SignUpOptions) => {
    try {
      console.log('📝 Attempting sign up for:', email);

      const signUpOptions: any = {
        data: {
          first_name: firstName.trim(),
          last_name: lastName?.trim() || '',
          role: 'user'
        }
      };

      // Add captcha token if provided (for Supabase CAPTCHA verification)
      if (options?.captchaToken) {
        signUpOptions.captchaToken = options.captchaToken;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: signUpOptions
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

        // Create extended profile in user_profiles table with subscription data
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
              kyc_status: 'not_started',
              // Subscription data - NO FREE ACCESS, must subscribe
              subscription_tier: null,
              subscription_status: null,
              chats_limit: 0,
              chats_used: 0
            }]);

          if (extendedProfileError) {
            console.error('⚠️ Error creating extended profile:', extendedProfileError);
          } else {
            console.log('✅ Extended profile with subscription created in user_profiles table');
          }
        } catch (extendedProfileError) {
          console.error('⚠️ Extended profile creation error:', extendedProfileError);
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

      // Clear user state immediately for responsive UI
      setUser(null);

      // Sign out with 'local' scope to ensure clean logout on mobile
      // This clears the session from localStorage without affecting server-side sessions
      const { error } = await supabase.auth.signOut({ scope: 'local' });

      if (error) {
        console.error('❌ Sign out error:', error);
        // Even if there's an error, we've already cleared local state
        // Try to clear any remaining auth tokens from localStorage
        try {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('sb-') && key.includes('-auth-token')) {
              localStorage.removeItem(key);
            }
          });
        } catch (e) {
          console.error('Error clearing localStorage:', e);
        }
      }

      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
      // Ensure user is cleared even on error
      setUser(null);
      throw error;
    }
  };

  // Function to refresh subscription data from user_profiles - call this after subscription changes
  const refreshSubscription = async () => {
    if (!user?.id) {
      console.log('⚠️ Cannot refresh subscription: No user logged in');
      return;
    }

    try {
      console.log('🔄 Refreshing subscription data for user:', user.id);

      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('subscription_tier, subscription_status, chats_limit, chats_used')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('❌ Error refreshing subscription:', error);
        return;
      }

      if (userProfile) {
        console.log('✅ Subscription refreshed:', userProfile.subscription_tier);
        setUser(prev => prev ? {
          ...prev,
          subscription_tier: userProfile.subscription_tier || null,
          chat_limit: userProfile.chats_limit ?? 1,
          chats_used: userProfile.chats_used || 0
        } : null);
      }
    } catch (error) {
      console.error('❌ Error refreshing subscription:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !initializing,
    isAdmin: user?.user_role === 'admin' || user?.user_role === 'super_admin',
    initializing,
    signIn,
    signUp,
    signOut,
    refreshSubscription
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};