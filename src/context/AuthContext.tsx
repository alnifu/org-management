import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Define types based on database schema
interface Officer {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  position_title: string;
  organization_id: string;
  is_admin: boolean;
  status: 'active' | 'inactive';
  bio?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  organization_ids: string[];
  bio: string;
  profile_picture_url: string;
  created_at: string;
  updated_at: string;
}

interface Organization {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  contact_email: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  organization_id: string;
  posted_by: string;
  is_members_only: boolean;
  scheduled_publish_date?: string;
  event_date?: string;
  location?: string;
  image_urls?: string[];
  likes: number;
  created_at: string;
  updated_at: string;
}

// Define auth state
interface AuthState {
  user: Officer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Define context type
interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<{ user: Officer | null; error: string | null }>;
  logout: () => Promise<void>;
  registerOfficer: (data: Omit<Officer, 'id' | 'created_at' | 'updated_at'> & { password: string }) => Promise<void>;
  updateProfile: (data: Partial<Officer>) => Promise<void>;
  resetError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Check if there's a stored user in localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An unknown error occurred',
        });
      }
    };

    checkSession();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Check if the officer exists and verify password
      const { data: officer, error: officerError } = await supabase
        .from('officers')
        .select()
        .eq('username', username)
        .single();
      
      if (officerError) {
        if (officerError.code === 'PGRST116') {
          throw new Error('Invalid credentials');
        }
        throw officerError;
      }

      if (!officer.password) {
        throw new Error('Invalid credentials');
      }

      // Direct password comparison
      if (officer.password !== password) {
        throw new Error('Invalid credentials');
      }
      
      // Store user in localStorage
      localStorage.setItem('user', JSON.stringify(officer));
      
      setState({
        user: officer,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { user: officer, error: null };
    } catch (error) {
      console.error('Error logging in:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }));
      return { user: null, error: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Remove user from localStorage
      localStorage.removeItem('user');
      
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error logging out:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }));
      throw error;
    }
  };

  // Register officer function
  const registerOfficer = async (data: Omit<Officer, 'id' | 'created_at' | 'updated_at'> & { password: string }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Create the officer record
      const { data: officer, error: officerError } = await supabase
        .from('officers')
        .insert([
          {
            username: data.username,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            position_title: data.position_title,
            organization_id: data.organization_id,
            is_admin: data.is_admin,
            status: data.status || 'active',
            bio: data.bio,
            profile_picture_url: data.profile_picture_url,
            password: data.password
          },
        ])
        .select()
        .single();
      
      if (officerError) throw officerError;
      
      setState({
        user: officer,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error registering officer:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }));
      throw error;
    }
  };

  // Update profile function
  const updateProfile = async (data: Partial<Officer>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!state.user) throw new Error('No user logged in');
      
      const { error } = await supabase
        .from('officers')
        .update(data)
        .eq('id', state.user.id);
      
      if (error) throw error;
      
      // Fetch the updated officer
      const { data: updatedOfficer, error: fetchError } = await supabase
        .from('officers')
        .select('*')
        .eq('id', state.user.id)
        .single();
      
      if (fetchError) throw fetchError;
      
      setState({
        user: updatedOfficer,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }));
      throw error;
    }
  };

  // Reset error function
  const resetError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        registerOfficer,
        updateProfile,
        resetError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 