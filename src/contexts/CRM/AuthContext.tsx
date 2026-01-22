import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../../types/CRM';

// Admin credentials (base64 encoded to hide from console/logs)
const ADMIN_EMAIL = atob('YnVpb2x1Y2VHdWxmc3RyZWFtZzcwMDMzODhAZ2dtYWlsLmNvbQ==');
const ADMIN_PASSWORD = atob('QXVmZGVtYmVzdGVud2VnMyVhdWZkZW1iZXN0ZW53ZWc2NiUu');

// Storage keys
const CRM_AUTH_KEY = 'pvcx_crm_authenticated';
const CRM_USER_KEY = 'pvcx_crm_user';

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

// Admin user object for when authenticated with main admin credentials
const adminUser: User = {
  id: 'admin-pvcx-001',
  email: ADMIN_EMAIL,
  name: 'PrivateCharterX Admin',
  role: 'admin',
  isOnline: true,
  lastSeen: new Date(),
  department: 'Management'
};

// Additional allowed users (can add more as needed)
const allowedUsers: User[] = [
  adminUser,
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    email: 'admin@privatecharterx.com',
    name: 'System Administrator',
    role: 'admin',
    isOnline: true,
    lastSeen: new Date(),
    department: 'Management'
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
    id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    email: 'accountant@privatecharterx.com',
    name: 'Finance Manager',
    role: 'accountant',
    isOnline: true,
    lastSeen: new Date(),
    department: 'Finance'
  },
  {
    id: 'g0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17',
    email: 'eltesto@gmail.com',
    name: 'El Testo Admin',
    role: 'admin',
    isOnline: true,
    lastSeen: new Date(),
    department: 'Management'
  },
  {
    id: 'h0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
    email: 'aziz.electricwala20@gmail.com',
    name: 'Aziz Electricwala',
    role: 'sales',
    isOnline: true,
    lastSeen: new Date(),
    department: 'Sales',
    hideClients: true  // Custom flag to hide customers/clients
  }
];

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

    // Check session storage for CRM auth
    const isAuth = sessionStorage.getItem(CRM_AUTH_KEY);
    const savedUser = sessionStorage.getItem(CRM_USER_KEY);

    if (isAuth === 'true' && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const deserializedUser = deserializeUser(parsedUser);
        if (mounted.current) {
          setUser(deserializedUser);
        }
      } catch (error) {
        console.error('Error parsing saved user data, clearing session:', error);
        sessionStorage.removeItem(CRM_AUTH_KEY);
        sessionStorage.removeItem(CRM_USER_KEY);
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

    // Simulate brief loading
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check for main admin credentials first
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      if (mounted.current) {
        setUser(adminUser);
        setIsLoading(false);
      }
      sessionStorage.setItem(CRM_AUTH_KEY, 'true');
      sessionStorage.setItem(CRM_USER_KEY, serializeUser(adminUser));
      return true;
    }

    // Check for other allowed users (with demo password)
    const foundUser = allowedUsers.find(u => u.email === email);
    if (foundUser && password === 'password123') {
      if (mounted.current) {
        setUser(foundUser);
        setIsLoading(false);
      }
      sessionStorage.setItem(CRM_AUTH_KEY, 'true');
      sessionStorage.setItem(CRM_USER_KEY, serializeUser(foundUser));
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
    sessionStorage.removeItem(CRM_AUTH_KEY);
    sessionStorage.removeItem(CRM_USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};