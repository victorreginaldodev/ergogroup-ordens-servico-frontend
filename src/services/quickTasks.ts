import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from './api';
import { isPaginatedResponse, PageResult, toPageResult } from './pagination';

const endpoint = '/api/tarefas-rapidas/';
const quickTaskCatalogEndpoint = '/api/repositorios-minios/';

export type QuickTaskItem = {
  id: number;
  quantidade: number;
  descricao: string | null;
  data_recebimento: string | null;
  data_inicio: string | null;
  data_termino: string | null;
  status: string;
  revisao_cliente?: boolean;
  faturamento: string;
  n_nf: string;
  cliente: {
    id: number;
    nome: string;
    tipo_cliente: string;
    cliente_ativo: string;
  };
  servico: {
    id: number;
    nome: string;
    descricao: string | null;
  };
  profile: {
    id: number;
    username: string;
    role: number;
  };
};

export type QuickTaskCatalogItem = {
  id: number;
  nome: string;
  descricao: string | null;
};

export const quickTasksService = {
  list: async (): Promise<QuickTaskItem[]> => {
    const { data } = await api.get(endpoint);
    return Array.isArray(data) ? data : [];
  },
  getById: async (id: number) => {
    const { data } = await api.get(`/api/minios/${id}/`);
    return data;
  },
  listMinioRepos: async (): Promise<any[]> => {
    const { data } = await api.get('/api/minios/');
    return Array.isArray(data) ? data : [];
  },
  listRepoMinios: async (): Promise<QuickTaskCatalogItem[]> => {
    const { data } = await api.get<QuickTaskCatalogItem[]>(quickTaskCatalogEndpoint);
    return Array.isArray(data) ? data : [];
  },
  repoMinioDetail: async (id: number | string) => {
    const { data } = await api.get<QuickTaskCatalogItem>(`${quickTaskCatalogEndpoint}${id}/`);
    return data;
  },
  createRepoMinio: async (payload: { nome: string; descricao?: string | null }) => {
    const { data } = await api.post<QuickTaskCatalogItem>(quickTaskCatalogEndpoint, payload);
    return data;
  },
  updateRepoMinio: async (id: number | string, payload: { nome?: string; descricao?: string | null }) => {
    const { data } = await api.patch<QuickTaskCatalogItem>(`${quickTaskCatalogEndpoint}${id}/`, payload);
    return data;
  },
  removeRepoMinio: async (id: number | string) => {
    await api.delete(`${quickTaskCatalogEndpoint}${id}/`);
    return id;
  },
  create: async (payload: {
    quantidade: number;
    descricao: string;
    data_recebimento: string;
    data_inicio?: string | null;
    data_termino?: string | null;
    status: string;
    revisao_cliente?: boolean;
    cliente: number;
    servico: number;
    profile: number;
  }) => {
    const { data } = await api.post('/api/minios/', payload);
    return data;
  },
  update: async (id: number, payload: {
    quantidade?: number;
    descricao?: string;
    data_recebimento?: string;
    data_inicio?: string | null;
    data_termino?: string | null;
    status?: string;
    revisao_cliente?: boolean;
    cliente?: number;
    servico?: number;
    profile?: number;
  }) => {
    const { data } = await api.patch(`/api/minios/${id}/`, payload);
    return data;
  },
  remove: async (id: number) => {
    await api.delete(`/api/minios/${id}/`);
    return id;
  },
};

export const useQuickTasksList = () => {
  return useQuery<QuickTaskItem[]>({
    queryKey: ['quickTasksList'],
    queryFn: async () => quickTasksService.list(),
  });
};

export const useMinioRepositories = () => {
  return useQuery<any[]>({
    queryKey: ['quickTasksMinioRepos'],
    queryFn: async () => quickTasksService.listMinioRepos(),
  });
};

export type QuickTasksPageParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
};

export const useMinioRepositoriesPage = (params: QuickTasksPageParams) => {
  return useQuery<PageResult<any>>({
    queryKey: ['quickTasksMinioReposPage', params],
    queryFn: async () => {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const queryParams: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };
      if (params.q) queryParams.q = params.q;
      if (params.status && params.status !== 'all') queryParams.status = params.status;

      const { data } = await api.get('/api/minios/', { params: queryParams });
      if (isPaginatedResponse<any>(data)) {
        return {
          ...toPageResult(data, page, pageSize),
          items: data.results,
        };
      }

      const items = Array.isArray(data) ? data : [];
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

export const useRepoMinioServices = () => {
  return useQuery<QuickTaskCatalogItem[]>({
    queryKey: ['quickTasksCatalog'],
    queryFn: async () => quickTasksService.listRepoMinios(),
  });
};

export const useCreateQuickTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: quickTasksService.create,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['quickTasksMinioRepos'] });
      await qc.invalidateQueries({ queryKey: ['quickTasksMinioReposPage'] });
    },
  });
};

export const useMinioById = (id?: number) => {
  return useQuery({
    queryKey: ['quickTaskMinioDetail', id],
    queryFn: async () => {
      if (!id) return null;
      return quickTasksService.getById(id);
    },
    enabled: !!id,
  });
};

export const useDeleteQuickTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => quickTasksService.remove(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['quickTasksMinioRepos'] });
      await qc.invalidateQueries({ queryKey: ['quickTasksMinioReposPage'] });
    },
  });
};

export const useUpdateQuickTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => quickTasksService.update(id, payload),
    onSuccess: async (_, vars) => {
      await qc.invalidateQueries({ queryKey: ['quickTasksMinioRepos'] });
      await qc.invalidateQueries({ queryKey: ['quickTasksMinioReposPage'] });
      await qc.invalidateQueries({ queryKey: ['quickTaskMinioDetail', vars.id] });
    },
  });
};

export const useQuickTaskCatalog = () => {
  return useQuery<QuickTaskCatalogItem[]>({
    queryKey: ['quickTasksCatalog'],
    queryFn: () => quickTasksService.listRepoMinios(),
  });
};

export type QuickTaskCatalogPageParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export const useQuickTaskCatalogPage = (params: QuickTaskCatalogPageParams) => {
  return useQuery<PageResult<QuickTaskCatalogItem>>({
    queryKey: ['quickTasksCatalogPage', params],
    queryFn: async () => {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 10;
      const queryParams: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };
      if (params.q) queryParams.q = params.q;

      const { data } = await api.get(quickTaskCatalogEndpoint, { params: queryParams });
      if (isPaginatedResponse<QuickTaskCatalogItem>(data)) {
        return {
          ...toPageResult(data, page, pageSize),
          items: data.results,
        };
      }

      const items = Array.isArray(data) ? (data as QuickTaskCatalogItem[]) : [];
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

export const useQuickTaskCatalogItem = (id?: string | number) => {
  return useQuery({
    queryKey: ['quickTasksCatalog', id],
    enabled: typeof id !== 'undefined',
    queryFn: () => {
      if (typeof id === 'undefined') throw new Error('missing id');
      return quickTasksService.repoMinioDetail(id);
    },
  });
};

export const useUpsertQuickTaskCatalog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: number | string; payload: { nome: string; descricao?: string | null } }) => {
      if (typeof id === 'undefined') {
        return quickTasksService.createRepoMinio(payload);
      }
      return quickTasksService.updateRepoMinio(id, payload);
    },
    onSuccess: async (_data, variables) => {
      await qc.invalidateQueries({ queryKey: ['quickTasksCatalog'] });
      await qc.invalidateQueries({ queryKey: ['quickTasksCatalogPage'] });
      if (variables.id !== undefined) {
        await qc.invalidateQueries({ queryKey: ['quickTasksCatalog', variables.id] });
      }
    },
  });
};

export const useDeleteQuickTaskCatalog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => quickTasksService.removeRepoMinio(id),
    onSuccess: async (_data, id) => {
      await qc.invalidateQueries({ queryKey: ['quickTasksCatalog'] });
      await qc.invalidateQueries({ queryKey: ['quickTasksCatalogPage'] });
      await qc.invalidateQueries({ queryKey: ['quickTasksCatalog', id] });
    },
  });
};
