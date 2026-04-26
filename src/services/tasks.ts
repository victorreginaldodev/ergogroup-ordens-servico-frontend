import { useMutation, useQuery } from '@tanstack/react-query';

import api from './api';
import { isPaginatedResponse, PageResult, toPageResult } from './pagination';

const endpoint = '/api/tarefas/tarefas/';

export interface CreateTaskPayload {
  responsavel: number;
  servico: number;
  descricao: string;
  data_inicio?: string | null;
  data_termino?: string | null;
  status?: string;
}

export interface UpdateTaskPayload {
  responsavel?: number;
  servico?: number;
  descricao?: string;
  data_inicio?: string | null;
  data_termino?: string | null;
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
    mutationFn: (payload: CreateTaskPayload) => tasksService.create(payload),
  });
};

export const useUpdateTask = () => {
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTaskPayload }) =>
      tasksService.update(id, payload),
  });
};

export const useDeleteTask = () => {
  return useMutation({
    mutationFn: (id: number) => tasksService.remove(id),
  });
};

export type TaskListItem = {
  id: number;
  servico: number;
  responsavel: number;
  responsavel_nome: string;
  status: string;
  status_display: string;
  descricao?: string | null;
  data_inicio?: string | null;
  data_termino?: string | null;
  atualizado_em: string;
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
  servico?: number;
  responsavel?: number;
};

export const useTasksListPage = (params: TasksPageParams) => {
  return useQuery<PageResult<TaskListItem>>({
    queryKey: ['tasksListPage', params],
    queryFn: async () => {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const queryParams: Record<string, string | number> = { page, page_size: pageSize };
      if (params.q) queryParams.q = params.q;
      if (params.status && params.status !== 'all') queryParams.status = params.status;
      if (params.servico) queryParams.servico = params.servico;
      if (params.responsavel) queryParams.responsavel = params.responsavel;

      const { data } = await api.get(endpoint, { params: queryParams });
      if (isPaginatedResponse<TaskListItem>(data)) {
        return { ...toPageResult(data, page, pageSize), items: data.results };
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
      return tasksService.getById(id);
    },
    enabled: !!id,
  });
};

export const useServiceTasks = (servicoId?: string | number) => {
  return useQuery<TaskListItem[]>({
    queryKey: ['serviceTasks', servicoId],
    enabled: !!servicoId,
    queryFn: async () => {
      const { data } = await api.get(endpoint, { params: { servico: servicoId, page_size: 200 } });
      if (isPaginatedResponse<TaskListItem>(data)) return data.results;
      return Array.isArray(data) ? (data as TaskListItem[]) : [];
    },
  });
};
