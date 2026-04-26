import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { UserProfile } from './auth';
import { TipoUsuarioKey } from './users';

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

export const useMyProfile = () => {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const { data } = await api.get<ProfileResponse>('/api/contas/usuarios/me/');
      return data;
    },
  });
};

export const useProfileDetail = (id?: number | null) => {
  return useQuery({
    queryKey: ['profile', id],
    enabled: typeof id === 'number',
    queryFn: async () => {
      if (typeof id !== 'number') throw new Error('missing id');
      const { data } = await api.get<ProfileResponse>(`/api/contas/usuarios/${id}/`);
      return data;
    },
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: UpdateProfilePayload }) => {
      const { data } = await api.patch<ProfileResponse>(`/api/contas/usuarios/${id}/`, payload);
      return data;
    },
    onSuccess: async (_data, { id }) => {
      await qc.invalidateQueries({ queryKey: ['profile', id] });
      await qc.invalidateQueries({ queryKey: ['profile', 'me'] });
      await qc.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};

export const useAlterarSenha = () => {
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: AlterarSenhaPayload }) => {
      const { data } = await api.patch(`/api/contas/usuarios/${id}/alterar-senha/`, payload);
      return data;
    },
  });
};
