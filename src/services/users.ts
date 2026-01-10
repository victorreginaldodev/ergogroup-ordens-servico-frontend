import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { UserDetail, UserProfile } from './auth';

export type TipoUsuarioKey =
  | 'diretor'
  | 'administrativo'
  | 'lider_tecnico'
  | 'sub_lider_tecnico'
  | 'tecnico';

export const NIVEL_USUARIO_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'normal', label: 'Normal' },
];

export const TIPO_USUARIO_OPTIONS: Array<{ value: TipoUsuarioKey; label: string }> = [
  { value: 'diretor', label: 'Diretor' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'lider_tecnico', label: 'Líder Técnico' },
  { value: 'sub_lider_tecnico', label: 'Sub-Líder Técnico' },
  { value: 'tecnico', label: 'Técnico' },
];

export interface CreateUserPayload {
  username: string;
  password: string;
  email: string;
  roleId: number;
  ativo: boolean;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  email?: string;
  roleId?: number;
  ativo?: boolean;
}

const endpoint = '/api/usuarios/';
const profilesEndpoint = '/api/profiles/';

export interface ProfileApi {
  id: number;
  user: UserDetail;
  role: string | number;
  cpf: string;
  created: string;
  token: string | null;
  profile_picture: string | null;
  active: boolean;
}

interface ProfileUpsertPayload {
  user: {
    username: string;
    email: string;
    password?: string;
  };
  role: number;
  active: boolean;
}

const ROLE_ID_MAP: Record<TipoUsuarioKey, number> = {
  diretor: 1,
  administrativo: 2,
  lider_tecnico: 3,
  sub_lider_tecnico: 4,
  tecnico: 5,
};
const ID_TO_ROLE_KEY: Record<number, TipoUsuarioKey> = {
  1: 'diretor',
  2: 'administrativo',
  3: 'lider_tecnico',
  4: 'sub_lider_tecnico',
  5: 'tecnico',
};

const toRoleId = (key: TipoUsuarioKey) => ROLE_ID_MAP[key] ?? ROLE_ID_MAP.operacional;

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/-/g, ' ')
    .trim();
const labelToKey = (label: string): TipoUsuarioKey => {
  const n = normalize(label);
  const map: Record<string, TipoUsuarioKey> = {
    'diretor': 'diretor',
    'administrativo': 'administrativo',
    'lider tecnico': 'lider_tecnico',
    'sub lider tecnico': 'sub_lider_tecnico',
    'tecnico': 'tecnico',
  };
  return map[n] ?? 'tecnico';
};

const mapProfileApiToUserProfile = (p: ProfileApi): UserProfile => {
  const tipo =
    typeof p.role === 'number'
      ? ID_TO_ROLE_KEY[p.role] ?? 'tecnico'
      : labelToKey(String(p.role));
  return {
    id: p.id,
    user: p.user,
    tipo_usuario: tipo,
    nivel_usuario: 'normal',
    foto_perfil: p.profile_picture,
    ativo: p.active,
    criado_em: p.created,
    criado_por: null,
    cpf: p.cpf,
    token: p.token,
  };
};

export const usersService = {
  list: async (): Promise<UserProfile[]> => {
    const res = await api.get<ProfileApi[]>(profilesEndpoint);
    const items = res.data;
    return items.map(mapProfileApiToUserProfile);
  },
  create: async (payload: CreateUserPayload): Promise<UserProfile> => {
    const body: ProfileUpsertPayload = {
      user: {
        username: payload.username,
        email: payload.email,
        password: payload.password,
      },
      role: payload.roleId ?? 5,
      active: payload.ativo,
    };
    const res = await api.post<ProfileApi>(profilesEndpoint, body);
    return mapProfileApiToUserProfile(res.data);
  },
  update: async (id: number, payload: UpdateUserPayload): Promise<UserProfile> => {
    const body: ProfileUpsertPayload = {
      user: {
        username: payload.username ?? '',
        email: payload.email ?? '',
        ...(payload.password ? { password: payload.password } : {}),
      },
      role: payload.roleId ?? 5,
      active: payload.ativo ?? true,
    };
    const res = await api.patch<ProfileApi>(`${profilesEndpoint}${id}/`, body);
    return mapProfileApiToUserProfile(res.data);
  },
  remove: async (id: number): Promise<void> => {
    await api.delete(`${profilesEndpoint}${id}/`);
  },
};

export const useUsers = () => {
  return useQuery<UserProfile[]>({
    queryKey: ['usuarios'],
    queryFn: () => usersService.list(),
  });
};

export const useUpsertUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: (CreateUserPayload & { id?: number }) | (UpdateUserPayload & { id: number })) => {
      if ('id' in payload && payload.id !== undefined) {
        const id = payload.id;
        const { id: _, ...rest } = payload as UpdateUserPayload & { id: number };
        return usersService.update(id, rest);
      }
      const createPayload = payload as CreateUserPayload;
      return usersService.create(createPayload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await usersService.remove(id);
      return id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['usuarios'] });
    },
  });
};
