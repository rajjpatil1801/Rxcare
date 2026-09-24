import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string, role?: string) => Promise<{ token: string; user: User; redirect_url?: string }>;
  register: (registrationData: any) => Promise<{ token: string; user: User; redirect_url?: string }>;
  loginAsDemoRole: (role: 'DOCTOR' | 'PATIENT' | 'LABORATORY' | 'PHARMACY') => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS = {
  DOCTOR: { id: 'DR-1001', email: 'doctor@rxcare.demo', password: 'demo123', label: 'Doctor (Dr. Rahul Mehta)' },
  PATIENT: { id: 'RX-PAT-1001', email: 'patient@rxcare.demo', password: 'demo123', label: 'Patient (Rahul Mehta)' },
  LABORATORY: { id: 'LAB-1001', email: 'lab@rxcare.demo', password: 'demo123', label: 'Laboratory (Apex Diagnostics)' },
  PHARMACY: { id: 'PHARM-1001', email: 'pharmacy@rxcare.demo', password: 'demo123', label: 'Pharmacy (Apollo Care)' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('rxcare_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('rxcare_token');
      if (storedToken) {
        try {
          const currentUser = await api.getCurrentUser();
          setUser(currentUser);
          setToken(storedToken);
        } catch (err) {
          console.error('Failed to restore session:', err);
          localStorage.removeItem('rxcare_token');
          localStorage.removeItem('rxcare_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (emailOrUsername: string, password: string, role?: string) => {
    setLoading(true);
    try {
      const resp = await api.login(emailOrUsername, password, role);
      setUser(resp.user);
      setToken(resp.token);
      return resp;
    } finally {
      setLoading(false);
    }
  };

  const register = async (registrationData: any) => {
    setLoading(true);
    try {
      const resp = await api.register(registrationData);
      setUser(resp.user);
      setToken(resp.token);
      return resp;
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoRole = async (role: 'DOCTOR' | 'PATIENT' | 'LABORATORY' | 'PHARMACY') => {
    const creds = DEMO_CREDENTIALS[role];
    await login(creds.id, creds.password, role);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const u = await api.getCurrentUser();
      setUser(u);
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        token,
        loading,
        login,
        register,
        loginAsDemoRole,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
