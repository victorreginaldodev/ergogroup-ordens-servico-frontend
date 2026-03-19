import { useMutation, useQuery } from '@tanstack/react-query';

import api from './api';
import { isPaginatedResponse, PageResult, toPageResult } from './pagination';

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
  data_criacao?: string;
  created_at?: string;
};

export const useTasksList = () => {
  return useQuery<TaskListItem[]>({
    queryKey: ['tasksList'],
    queryFn: async () => {
      const items = await tasksService.list();
      return items as TaskListItem[];
    },
  });
};

export type TasksPageParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
};

export const useTasksListPage = (params: TasksPageParams) => {
  return useQuery<PageResult<TaskListItem>>({
    queryKey: ['tasksListPage', params],
    queryFn: async () => {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const queryParams: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };
      if (params.q) queryParams.q = params.q;
      if (params.status && params.status !== 'all') queryParams.status = params.status;

      const { data } = await api.get(endpoint, { params: queryParams });
      if (isPaginatedResponse<TaskListItem>(data)) {
        return {
          ...toPageResult(data, page, pageSize),
          items: data.results,
        };
      }

      const items = Array.isArray(data) ? (data as TaskListItem[]) : [];
      return {
        items,
        count: items.length,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
        next: null,
        previous: null,
      };
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
