import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { UserProfile } from './auth';

export type StatusExecucao = 'nao_iniciado' | 'em_andamento' | 'concluido';

export interface Executor {
  id: number;
  servico: number;
  executor: number; // User ID
  executor_details?: UserProfile; // Optional, depends on backend expansion, but useful to type if present
  status_execucao: StatusExecucao;
  data_inicio: string | null; // YYYY-MM-DD
  data_termino: string | null; // YYYY-MM-DD
}

export interface CreateExecutorPayload {
  servico: number;
  executor: number;
  status_execucao: StatusExecucao;
  data_inicio?: string | null;
  data_termino?: string | null;
}

export interface UpdateExecutorPayload {
  servico?: number;
  executor?: number;
  status_execucao?: StatusExecucao;
  data_inicio?: string | null;
  data_termino?: string | null;
}

const endpoint = '/api/executores/';

export const executoresService = {
  list: async (servicoId?: number): Promise<Executor[]> => {
    // Assuming we can filter by service. If not, we might need to filter client-side.
    // Based on typical REST patterns, filtering often uses query params.
    const url = servicoId ? `${endpoint}?servico=${servicoId}` : endpoint;
    const res = await api.get<Executor[]>(url);
    return res.data;
  },
  get: async (id: number): Promise<Executor> => {
    const res = await api.get<Executor>(`${endpoint}${id}/`);
    return res.data;
  },
  create: async (payload: CreateExecutorPayload): Promise<Executor> => {
    const res = await api.post<Executor>(endpoint, payload);
    return res.data;
  },
  update: async (id: number, payload: UpdateExecutorPayload): Promise<Executor> => {
    const res = await api.patch<Executor>(`${endpoint}${id}/`, payload);
    return res.data;
  },
  replace: async (id: number, payload: CreateExecutorPayload): Promise<Executor> => {
    const res = await api.put<Executor>(`${endpoint}${id}/`, payload);
    return res.data;
  },
  remove: async (id: number): Promise<void> => {
    await api.delete(`${endpoint}${id}/`);
  },
};

export const useExecutores = (servicoId: number) => {
  return useQuery<Executor[]>({
    queryKey: ['executores', servicoId],
    queryFn: () => executoresService.list(servicoId),
    enabled: !!servicoId,
  });
};

export const useExecutorOperations = (servicoId?: number) => {
  const queryClient = useQueryClient();

  const createExecutor = useMutation({
    mutationFn: executoresService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executores'] });
      if (servicoId) {
          queryClient.invalidateQueries({ queryKey: ['executores', servicoId] });
      }
    },
  });

  const updateExecutor = useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & UpdateExecutorPayload) =>
      executoresService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executores'] });
      if (servicoId) {
          queryClient.invalidateQueries({ queryKey: ['executores', servicoId] });
      }
    },
  });

  const removeExecutor = useMutation({
    mutationFn: executoresService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executores'] });
      if (servicoId) {
          queryClient.invalidateQueries({ queryKey: ['executores', servicoId] });
      }
    },
  });

  return {
    createExecutor,
    updateExecutor,
    removeExecutor,
  };
};
