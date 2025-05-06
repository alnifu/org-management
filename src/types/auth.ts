export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  position_title: string;
  bio?: string;
  profile_picture_url?: string;
  is_admin: boolean;
  organization_id?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterOfficerData {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  position_title: string;
  organization_id: string;
  is_admin: boolean;
} 