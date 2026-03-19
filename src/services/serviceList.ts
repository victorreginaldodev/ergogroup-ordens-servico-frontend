import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/services/api';
import { ServiceExecution, ServiceListItem } from '@/types';

import { isPaginatedResponse, PageResult, toPageResult } from './pagination';

const mapServiceListItem = (item: any): ServiceListItem => {
  const id = item.id;
  const status = item.status ?? 'nao_iniciado';
  const ordem_servico = item.ordem_servico;
  const rawTemTarefas = item.tem_tarefas ?? item.temTarefas ?? item.hasTasks ?? item.has_tasks;
  const tem_tarefas = Boolean(rawTemTarefas);

  let cliente_nome = item.cliente_nome ?? '';
  let servico_catalogo_nome = item.servico_catalogo_nome ?? '';

  if (!servico_catalogo_nome) {
    if (item.repositorio?.nome) {
      servico_catalogo_nome = item.repositorio.nome;
    } else {
      const detailed = item as ServiceExecution;
      servico_catalogo_nome =
        detailed.nome_servico ??
        detailed.catalogo_servico_details?.nome ??
        String(detailed.catalogo_servico ?? '');
    }
  }

  if (!cliente_nome) {
    const detailed = item as ServiceExecution;
    cliente_nome = detailed.nome_cliente ?? detailed.ordem_servico_details?.cliente_details?.nome ?? '';
  }

  const data_criacao =
    item.data_criacao ??
    item.created_at ??
    item.ordem_servico_details?.data_criacao ??
    item.ordem_servico_details?.data_venda ??
    '';

  return {
    id,
    cliente_nome,
    servico_catalogo_nome,
    status,
    ordem_servico,
    tem_tarefas,
    data_criacao,
  } as ServiceListItem;
};

export const useServiceList = () => {
  return useQuery<ServiceListItem[]>({
    queryKey: ['serviceList'],
    queryFn: async () => {
      const { data } = await api.get<any[]>('/api/servicos/');
      return (data ?? []).map(mapServiceListItem);
    },
  });
};

export type ServiceListPageParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  hasTasks?: string;
};

export const useServiceListPage = (params: ServiceListPageParams) => {
  return useQuery<PageResult<ServiceListItem>>({
    queryKey: ['serviceListPage', params],
    queryFn: async () => {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const queryParams: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };
      if (params.q) queryParams.q = params.q;
      if (params.status && params.status !== 'all') queryParams.status = params.status;
      if (params.hasTasks) queryParams.has_tasks = params.hasTasks;

      const { data } = await api.get('/api/servicos/', { params: queryParams });
      if (isPaginatedResponse<any>(data)) {
        return {
          ...toPageResult(data, page, pageSize),
          items: data.results.map(mapServiceListItem),
        };
      }

      const items = (Array.isArray(data) ? data : []).map(mapServiceListItem);
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

export const useServiceExecutionById = (id: string) => {
  return useQuery<ServiceExecution>({
    queryKey: ['serviceExecution', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ServiceExecution>(`/api/servicos/${id}/`);
      return data;
    },
  });
};

export const useUpdateServiceStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { data } = await api.patch(`/api/servicos/${id}/`, { status });
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['serviceExecution', String(variables.id)] });
      qc.invalidateQueries({ queryKey: ['serviceList'] });
      qc.invalidateQueries({ queryKey: ['serviceListPage'] });
    },
  });
};
