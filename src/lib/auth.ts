import { supabase } from './supabase';
import { User, LoginCredentials, RegisterCredentials } from '../types/auth';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `https://${import.meta.env.VITE_AUTH0_DOMAIN}/.well-known/jwks.json`
});

const getKey = (header: any, callback: any) => {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
};

export const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        issuer: `https://${import.meta.env.VITE_AUTH0_DOMAIN}/`,
        algorithms: ['RS256']
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      }
    );
  });
};

export const login = async (credentials: LoginCredentials): Promise<{ user: User | null; error?: string }> => {
  try {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (error) throw error;

    if (!user) {
      return { user: null, error: 'Login failed' };
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    return { user: user as User };
  } catch (error) {
    logger.error('Login error:', error);
    return { user: null, error: 'Invalid email or password' };
  }
};

export const register = async (credentials: RegisterCredentials): Promise<{ user: User | null; error?: string }> => {
  try {
    const { data: { user }, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          name: credentials.name,
          phone: credentials.phone
        }
      }
    });

    if (error) throw error;

    if (!user) {
      return { user: null, error: 'Registration failed' };
    }

    return { user: user as User };
  } catch (error) {
    logger.error('Registration error:', error);
    return { user: null, error: 'Registration failed. Please try again.' };
  }
};

export const logout = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user as User | null;
  } catch (error) {
    logger.error('Get current user error:', error);
    return null;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return !!user;
};