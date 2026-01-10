import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { UserProfile } from './auth';

export type ProfileResponse = {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  role: number;
  role_display: string;
  created: string;
  active: boolean;
};

export type UpdateProfilePayload = {
  user: {
    username: string;
    email: string;
    password?: string;
  };
  role: number;
  active: boolean;
};

const ROLE_ID_TO_KEY: Record<number, UserProfile['tipo_usuario']> = {
  1: 'diretor',
  2: 'administrativo',
  3: 'lider_tecnico',
  4: 'sub_lider_tecnico',
  5: 'tecnico',
};

export const profileResponseToUserProfile = (profile: ProfileResponse): UserProfile => ({
  id: profile.id,
  user: {
    id: profile.user.id,
    username: profile.user.username,
    email: profile.user.email,
    first_name: '',
    last_name: '',
  },
  tipo_usuario: ROLE_ID_TO_KEY[profile.role] ?? 'tecnico',
  nivel_usuario: 'normal',
  foto_perfil: null,
  ativo: profile.active,
  criado_em: profile.created,
  criado_por: null,
  cpf: undefined,
  token: null,
});

export const useProfileDetail = (id?: number | null) => {
  return useQuery({
    queryKey: ['profile', id],
    enabled: typeof id === 'number',
    queryFn: async () => {
      if (typeof id !== 'number') {
        throw new Error('missing id');
      }
      const { data } = await api.get<ProfileResponse>(`/api/profiles/${id}/`);
      return data;
    },
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: UpdateProfilePayload }) => {
      const { data } = await api.patch<ProfileResponse>(`/api/profiles/${id}/`, payload);
      return data;
    },
    onSuccess: async (_data, { id }) => {
      await qc.invalidateQueries({ queryKey: ['profile', id] });
    },
  });
};

