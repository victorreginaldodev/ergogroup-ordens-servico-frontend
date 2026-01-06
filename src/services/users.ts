import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { UserDetail, UserProfile } from './auth';

export type TipoUsuarioKey =
  | 'admin_geral'
  | 'financeiro'
  | 'comercial'
  | 'admin_tecnico'
  | 'sub_admin_tecnico'
  | 'operacional';

export const TIPO_USUARIO_OPTIONS: Array<{ value: TipoUsuarioKey; label: string }> = [
  { value: 'admin_geral', label: 'Administrador Geral' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'admin_tecnico', label: 'Administrador Operacional' },
  { value: 'sub_admin_tecnico', label: 'Sub Administrador Operacional' },
  { value: 'operacional', label: 'Operacional' },
];

export interface CreateUserPayload {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  tipo_usuario: TipoUsuarioKey;
  ativo: boolean;
  foto_perfil?: File | null;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  tipo_usuario?: TipoUsuarioKey;
  ativo?: boolean;
  foto_perfil?: File | null;
}

const endpoint = '/api/usuarios/';

const toFormData = (data: Record<string, unknown>) => {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (v instanceof File) {
      fd.append(k, v);
    } else {
      fd.append(k, String(v));
    }
  });
  return fd;
};

export const usersService = {
  list: async (): Promise<UserProfile[]> => {
    const res = await api.get<UserProfile[]>(endpoint);
    return res.data;
  },
  create: async (payload: CreateUserPayload): Promise<UserProfile> => {
    const fd = toFormData({
      username: payload.username,
      password: payload.password,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      tipo_usuario: payload.tipo_usuario,
      ativo: payload.ativo,
      foto_perfil: payload.foto_perfil || undefined,
    });
    const res = await api.post<UserProfile>(endpoint, fd);
    return res.data;
  },
  update: async (id: number, payload: UpdateUserPayload): Promise<UserProfile> => {
    const hasFile = !!payload.foto_perfil;
    if (hasFile) {
      const fd = toFormData(payload as Record<string, unknown>);
      const res = await api.patch<UserProfile>(`${endpoint}${id}/`, fd);
      return res.data;
    }
    const res = await api.patch<UserProfile>(`${endpoint}${id}/`, payload);
    return res.data;
  },
  remove: async (id: number): Promise<void> => {
    await api.delete(`${endpoint}${id}/`);
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

