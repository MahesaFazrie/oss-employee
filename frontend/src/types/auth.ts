export interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'rejected' | 'inactive';
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: User;
    // Field khusus register response
    id?: number;
    name?: string;
    email?: string;
    status?: string;
  };
  errors?: Record<string, string[]>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}
