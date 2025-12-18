import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const mockUsers: User[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    email: 'admin@privatecharterx.com',
    name: 'John Administrator',
    role: 'admin',
    isOnline: true,
    lastSeen: new Date(),
    department: 'Management'
  },
  {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    email: 'employee@privatecharterx.com',
    name: 'Sarah Johnson',
    role: 'employee',
    isOnline: true,
    lastSeen: new Date(),
    department: 'Operations'
  },
  {
    id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    email: 'sales@privatecharterx.com',
    name: 'Mike Sales',
    role: 'sales',
    isOnline: true,
    lastSeen: new Date(),
    department: 'Sales'
  },
  {
    id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    email: 'marketing@privatecharterx.com',
    name: 'Emma Marketing',
    role: 'marketing',
    isOnline: true,
    lastSeen: new Date(),
    department: 'Marketing'
  },
  {
    id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    email: 'aschaufelberger@privatecharterx.com',
    name: 'Andrin Schaufelberger',
    role: 'admin',
    isOnline: true,
    lastSeen: new Date(),
    department: 'Management'
  },
  {
    id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    email: 'accountant@privatecharterx.com',
    name: 'Finance Manager',
    role: 'accountant',
    isOnline: true,
    lastSeen: new Date(),
    department: 'Finance'
  }
];

// Helper function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Helper function to deserialize user data and convert date strings back to Date objects
const deserializeUser = (userData: any): User => {
  return {
    ...userData,
    lastSeen: userData.lastSeen ? new Date(userData.lastSeen) : new Date(),
    birthday: userData.birthday ? new Date(userData.birthday) : undefined
  };
};

// Helper function to serialize user data for localStorage
const serializeUser = (user: User): string => {
  return JSON.stringify({
    ...user,
    lastSeen: user.lastSeen.toISOString(),
    birthday: user.birthday?.toISOString()
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    
    const savedUser = localStorage.getItem('privatecharterx_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Validate that the user has a proper UUID, if not clear localStorage
        if (parsedUser.id && isValidUUID(parsedUser.id)) {
          // Convert date strings back to Date objects
          const deserializedUser = deserializeUser(parsedUser);
          if (mounted.current) {
            setUser(deserializedUser);
          }
        } else {
          console.warn('Invalid user ID format detected, clearing localStorage');
          localStorage.removeItem('privatecharterx_user');
        }
      } catch (error) {
        console.error('Error parsing saved user data, clearing localStorage:', error);
        localStorage.removeItem('privatecharterx_user');
      }
    }
    
    if (mounted.current) {
      setIsLoading(false);
    }

    return () => {
      mounted.current = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (mounted.current) {
      setIsLoading(true);
    }
    
    // Mock authentication
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && password === 'password123') {
      if (mounted.current) {
        setUser(foundUser);
        setIsLoading(false);
      }
      // Serialize user data properly for localStorage
      localStorage.setItem('privatecharterx_user', serializeUser(foundUser));
      return true;
    }
    
    if (mounted.current) {
      setIsLoading(false);
    }
    return false;
  };

  const logout = () => {
    if (mounted.current) {
      setUser(null);
    }
    localStorage.removeItem('privatecharterx_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};