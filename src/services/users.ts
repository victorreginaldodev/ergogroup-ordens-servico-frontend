import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';

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

export const usersService = {
  list: async (): Promise<UsuarioApi[]> => {
    const res = await api.get<UsuarioApi[]>(endpoint);
    return Array.isArray(res.data) ? res.data : [];
  },
  getById: async (id: number): Promise<UsuarioApi> => {
    const res = await api.get<UsuarioApi>(`${endpoint}${id}/`);
    return res.data;
  },
  create: async (payload: CreateUserPayload): Promise<UsuarioApi> => {
    const res = await api.post<UsuarioApi>(endpoint, payload);
    return res.data;
  },
  update: async (id: number, payload: UpdateUserPayload): Promise<UsuarioApi> => {
    const res = await api.patch<UsuarioApi>(`${endpoint}${id}/`, payload);
    return res.data;
  },
  remove: async (id: number): Promise<void> => {
    await api.delete(`${endpoint}${id}/`);
  },
  alterarSenha: async (
    id: number,
    payload: { senha_atual: string; nova_senha: string; nova_senha_confirmacao: string },
  ) => {
    const res = await api.patch(`${endpoint}${id}/alterar-senha/`, payload);
    return res.data;
  },
};

export const useUsers = () => {
  return useQuery<UsuarioApi[]>({
    queryKey: ['usuarios'],
    queryFn: () => usersService.list(),
  });
};

export const useUpsertUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: (CreateUserPayload & { id?: number }) | (UpdateUserPayload & { id: number }),
    ) => {
      if ('id' in payload && payload.id !== undefined) {
        const { id, ...rest } = payload as UpdateUserPayload & { id: number };
        return usersService.update(id, rest);
      }
      return usersService.create(payload as CreateUserPayload);
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
