import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { supabase, User } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isConnected: boolean;
  walletAddress: string | undefined;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  showAuth: boolean;
  authMode: 'login' | 'register';
  openLogin: () => void;
  openRegister: () => void;
  closeAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Listen to Supabase Auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[Auth] Auth state changed:', _event, session?.user?.email);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch or create user profile when wallet connects OR when auth session exists
  useEffect(() => {
    const fetchOrCreateUser = async () => {
      // Prioritize wallet address if connected
      const identifier = address || session?.user?.id;

      if (!identifier) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        let existingUser = null;

        // If wallet is connected, search by wallet address
        if (address) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', address.toLowerCase())
            .single();
          existingUser = data;
        }
        // Otherwise, search by auth user ID or email
        else if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('*')
            .or(`id.eq.${session.user.id},email.eq.${session.user.email}`)
            .single();
          existingUser = data;
        }

        if (existingUser) {
          // Update email if auth session has it and user doesn't
          if (session?.user?.email && !existingUser.email) {
            const { data: updatedUser } = await supabase
              .from('users')
              .update({ email: session.user.email })
              .eq('id', existingUser.id)
              .select()
              .single();
            setUser(updatedUser || existingUser);
          } else {
            setUser(existingUser);
          }
        } else {
          // Create new user profile
          const newUserData: any = {
            username: session?.user?.email?.split('@')[0] || `user_${Date.now()}`,
          };

          if (address) {
            newUserData.wallet_address = address.toLowerCase();
          }
          if (session?.user?.email) {
            newUserData.email = session.user.email;
          }

          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert(newUserData)
            .select()
            .single();

          if (createError) {
            console.error('[Auth] Error creating user:', createError);
          } else {
            setUser(newUser);
          }
        }
      } catch (err) {
        console.error('[Auth] Error fetching user:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrCreateUser();
  }, [address, session]);

  const logout = async () => {
    // Sign out from Supabase Auth
    await supabase.auth.signOut();
    // Disconnect wallet
    disconnect();
    setUser(null);
    setSession(null);
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!address || !user) return;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('wallet_address', address.toLowerCase())
      .select()
      .single();

    if (error) {
      throw error;
    }

    setUser(data);
  };

  const openLogin = () => {
    setAuthMode('login');
    setShowAuth(true);
  };

  const openRegister = () => {
    setAuthMode('register');
    setShowAuth(true);
  };

  const closeAuth = () => {
    setShowAuth(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConnected,
        walletAddress: address,
        logout,
        updateUserProfile,
        showAuth,
        authMode,
        openLogin,
        openRegister,
        closeAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
