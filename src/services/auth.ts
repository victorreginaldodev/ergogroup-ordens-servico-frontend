import api from './api';

export interface UserDetail {
  id: number;
  username: string;
  email: string;
  nome_completo: string;
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

export interface UsuarioPayload {
  id: number;
  email: string;
  username: string;
  nome_completo: string;
  tipo_usuario: string;
  tipo_usuario_display: string;
  ativo: boolean;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface TokenLoginResponse {
  refresh: string;
  access: string;
  usuario: UsuarioPayload;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

const usuarioToUserProfile = (usuario: UsuarioPayload): UserProfile => ({
  id: usuario.id,
  user: {
    id: usuario.id,
    username: usuario.username,
    email: usuario.email,
    nome_completo: usuario.nome_completo,
    first_name: '',
    last_name: '',
  },
  tipo_usuario: usuario.tipo_usuario,
  nivel_usuario: 'normal',
  foto_perfil: null,
  ativo: usuario.ativo,
  criado_em: '',
  criado_por: null,
});

export const authService = {
  login: async (credentials: LoginCredentials): Promise<TokenLoginResponse> => {
    const response = await api.post<TokenLoginResponse>('/api/contas/auth/login/', {
      email: credentials.email,
      password: credentials.password,
    });

    const data = response.data;
    const userProfile = usuarioToUserProfile(data.usuario);

    const compatibleAuthData = {
      refresh: data.refresh,
      access: data.access,
      user: userProfile,
    };

    localStorage.setItem('auth_data', JSON.stringify(compatibleAuthData));
    localStorage.setItem('auth_raw', JSON.stringify(data));
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);

    return data;
  },

  logout: async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      try {
        await api.post('/api/contas/auth/logout/', { refresh });
      } catch {
        // ignora erros de logout no backend
      }
    }
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
      } catch {
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
