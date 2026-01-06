import api from './api';

export interface UserDetail {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface UserProfile {
  id: number;
  user: UserDetail;
  tipo_usuario: string;
  foto_perfil: string | null;
  ativo: boolean;
  criado_em: string;
  criado_por: string | null;
}

export interface LoginResponse {
  refresh: string;
  access: string;
  user: UserProfile;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/api/usuarios/login/', {
      email: credentials.email,
      password: credentials.password,
    });
    
    const data = response.data;
    
    // Saving the whole structure as requested
    localStorage.setItem('auth_data', JSON.stringify(data));
    
    // Saving tokens specifically for easy access (e.g. by api.ts)
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    
    return data;
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await api.post('/api/usuarios/password-reset/', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/api/usuarios/password-reset/confirm/', { token, new_password: newPassword });
  },

  logout: () => {
    localStorage.removeItem('auth_data');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
  
  getCurrentUser: (): UserProfile | null => {
    const authData = localStorage.getItem('auth_data');
    if (authData) {
      try {
        return JSON.parse(authData).user;
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  setCurrentUser: (profile: UserProfile) => {
    const authDataRaw = localStorage.getItem('auth_data');
    if (authDataRaw) {
      try {
        const authData = JSON.parse(authDataRaw);
        authData.user = profile;
        localStorage.setItem('auth_data', JSON.stringify(authData));
      } catch {
        localStorage.setItem('auth_data', JSON.stringify({ user: profile }));
      }
    } else {
      localStorage.setItem('auth_data', JSON.stringify({ user: profile }));
    }
  },
};
