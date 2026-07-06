import api from '@/services/api';
import type { UserProfile } from '@/services/auth';

export type TipoUsuarioKey =
  | 'diretor'
  | 'gestor_comercial'
  | 'comercial'
  | 'gestor_tecnico'
  | 'sub_gestor_tecnico'
  | 'tecnico'
  | 'gestor_financeiro'
  | 'financeiro'
  | 'gestor_administrativo'
  | 'administrativo';

export const TIPO_USUARIO_OPTIONS: Array<{ value: TipoUsuarioKey; label: string }> = [
  { value: 'diretor',               label: 'Diretor' },
  { value: 'gestor_comercial',      label: 'Gestor Comercial' },
  { value: 'comercial',             label: 'Comercial' },
  { value: 'gestor_tecnico',        label: 'Líder Técnico' },
  { value: 'sub_gestor_tecnico',    label: 'Sub-Líder Técnico' },
  { value: 'tecnico',               label: 'Técnico' },
  { value: 'gestor_financeiro',     label: 'Gestor Financeiro' },
  { value: 'financeiro',            label: 'Financeiro' },
  { value: 'gestor_administrativo', label: 'Gestor Administrativo' },
  { value: 'administrativo',        label: 'Administrativo' },
];

const endpoint = '/api/contas/usuarios/';

export interface UsuarioApi {
  id: number;
  email: string;
  username: string;
  nome_completo: string;
  tipo_usuario: TipoUsuarioKey;
  tipo_usuario_display: string;
  ativo: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  data_criacao?: string;
  last_login?: string | null;
}

export interface CreateUserPayload {
  email: string;
  username: string;
  nome_completo: string;
  tipo_usuario: TipoUsuarioKey;
  ativo: boolean;
  password: string;
  password_confirmacao: string;
}

export interface UpdateUserPayload {
  email?: string;
  username?: string;
  nome_completo?: string;
  tipo_usuario?: TipoUsuarioKey;
  ativo?: boolean;
}

export const getUsers = async (): Promise<UsuarioApi[]> => {
  const res = await api.get<UsuarioApi[]>(endpoint);
  return Array.isArray(res.data) ? res.data : [];
};

export const createUser = async (payload: CreateUserPayload): Promise<UsuarioApi> => {
  const res = await api.post<UsuarioApi>(endpoint, payload);
  return res.data;
};

export const updateUser = async (id: number, payload: UpdateUserPayload): Promise<UsuarioApi> => {
  const res = await api.patch<UsuarioApi>(`${endpoint}${id}/`, payload);
  return res.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`${endpoint}${id}/`);
};

// ── Perfil do usuário autenticado ────────────────────────────────────────────

export type ProfileResponse = {
  id: number;
  email: string;
  username: string;
  nome_completo: string;
  tipo_usuario: TipoUsuarioKey;
  tipo_usuario_display: string;
  ativo: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  data_criacao: string;
  last_login: string | null;
};

export type UpdateProfilePayload = {
  email?: string;
  username?: string;
  nome_completo?: string;
  tipo_usuario?: TipoUsuarioKey;
  ativo?: boolean;
};

export type AlterarSenhaPayload = {
  senha_atual: string;
  nova_senha: string;
  nova_senha_confirmacao: string;
};

export const profileResponseToUserProfile = (profile: ProfileResponse): UserProfile => ({
  id: profile.id,
  user: {
    id: profile.id,
    username: profile.username,
    email: profile.email,
    nome_completo: profile.nome_completo,
    first_name: '',
    last_name: '',
  },
  tipo_usuario: profile.tipo_usuario,
  nivel_usuario: 'normal',
  foto_perfil: null,
  ativo: profile.ativo,
  criado_em: profile.data_criacao,
  criado_por: null,
  cpf: undefined,
  token: null,
});

export const getMyProfile = async (): Promise<ProfileResponse> => {
  const { data } = await api.get<ProfileResponse>(`${endpoint}me/`);
  return data;
};

export const getProfileDetail = async (id: number): Promise<ProfileResponse> => {
  const { data } = await api.get<ProfileResponse>(`${endpoint}${id}/`);
  return data;
};

export const updateProfile = async (id: number, payload: UpdateProfilePayload): Promise<ProfileResponse> => {
  const { data } = await api.patch<ProfileResponse>(`${endpoint}${id}/`, payload);
  return data;
};

export const alterarSenha = async (id: number, payload: AlterarSenhaPayload) => {
  const { data } = await api.patch(`${endpoint}${id}/alterar-senha/`, payload);
  return data;
};
