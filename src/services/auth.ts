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
  nivel_usuario: string;
  foto_perfil: string | null;
  ativo: boolean;
  criado_em: string;
  criado_por: string | null;
  cpf?: string;
  token?: string | null;
}

export interface TokenLoginResponse {
  refresh: string;
  access: string;
  user: UserDetail;
  profile: {
    id: number;
    role: string;
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<TokenLoginResponse> => {
    const response = await api.post<TokenLoginResponse>('/api/token/', {
      username: credentials.username,
      password: credentials.password,
    });
    
    const data = response.data;
    
    const normalize = (s: string) =>
      s
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/-/g, ' ')
        .trim();
    const map: Record<string, string> = {
      'diretor': 'diretor',
      'administrativo': 'administrativo',
      'lider tecnico': 'lider_tecnico',
      'sub lider tecnico': 'sub_lider_tecnico',
      'tecnico': 'tecnico',
    };
    const tipoUsuario = map[normalize(data.profile.role)] ?? 'tecnico';

    const mergedUserProfile: UserProfile = {
      id: data.profile.id,
      user: data.user,
      tipo_usuario: tipoUsuario,
      nivel_usuario: 'normal',
      foto_perfil: null,
      ativo: true,
      criado_em: '',
      criado_por: null,
    };

    const compatibleAuthData = {
      refresh: data.refresh,
      access: data.access,
      user: mergedUserProfile,
    };

    localStorage.setItem('auth_data', JSON.stringify(compatibleAuthData));
    localStorage.setItem('auth_raw', JSON.stringify(data));
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
    localStorage.removeItem('auth_raw');
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
