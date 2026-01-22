import { useMutation } from '@tanstack/react-query';
import api from './api';

const endpoint = '/api/tarefas/';

export interface CreateTaskPayload {
  profile_id: number;
  servico_id: number;
  descricao: string;
}

export interface UpdateTaskPayload {
  profile_id?: number;
  servico_id?: number;
  descricao?: string;
  data_inicio?: string;
  data_termino?: string;
  status?: string;
}

export const tasksService = {
  create: async (payload: CreateTaskPayload) => {
    const { data } = await api.post(endpoint, payload);
    return data;
  },
  list: async () => {
    const { data } = await api.get(endpoint);
    return Array.isArray(data) ? data : [];
  },
  getById: async (id: number) => {
    const { data } = await api.get(`${endpoint}${id}/`);
    return data;
  },
  update: async (id: number, payload: UpdateTaskPayload) => {
    const { data } = await api.patch(`${endpoint}${id}/`, payload);
    return data;
  },
  remove: async (id: number) => {
    await api.delete(`${endpoint}${id}/`);
    return id;
  },
};

export const useCreateTask = () => {
  return useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      return tasksService.create(payload);
    },
  });
};

export const useUpdateTask = () => {
  return useMutation({
    mutationFn: async (input: { id: number; payload: UpdateTaskPayload }) => {
      return tasksService.update(input.id, input.payload);
    },
  });
};

export const useDeleteTask = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      return tasksService.remove(id);
    },
  });
};

export type TaskListItem = {
  id: number;
  cliente_nome: string;
  repositorio_nome: string;
  usuario_nome: string;
  status: string;
  servico_descricao?: string;
};

import { useQuery } from '@tanstack/react-query';

export const useTasksList = () => {
  return useQuery<TaskListItem[]>({
    queryKey: ['tasksList'],
    queryFn: async () => {
      const items = await tasksService.list();
      return items as TaskListItem[];
    },
  });
};

export const useTaskById = (id?: number) => {
  return useQuery({
    queryKey: ['taskDetail', id],
    queryFn: async () => {
      if (!id) return null;
      const detail = await tasksService.getById(id);
      return detail;
    },
    enabled: !!id,
  });
};
