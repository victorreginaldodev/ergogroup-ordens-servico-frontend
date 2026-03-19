import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { isPaginatedResponse, PageResult, toPageResult } from './pagination';

export type BillingServiceOrder = {
  id: number;
  numero_os: number;
  cliente_nome: string;
  valor: number;
  forma_pagamento: string | null;
  quantidade_parcelas: number | null;
  cobranca_imediata: string | null;
  faturamento_1: string | null;
  nome_contato_envio_nf: string | null;
  contato_envio_nf: string | null;
  observacao: string | null;
  faturamento: string | null;
  data_faturamento: string | null;
  numero_nf: number | null;
  concluida: string | null;
};

export const useBillingServiceOrders = () => {
  return useQuery({
    queryKey: ['billing-service-orders'],
    queryFn: async () => {
      const { data } = await api.get<BillingServiceOrder[]>('/api/ordens-servico/faturamento/');
      return data ?? [];
    },
  });
};

export type BillingOrdersPageParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  billing?: string;
};

export const useBillingServiceOrdersPage = (params: BillingOrdersPageParams) => {
  return useQuery<PageResult<BillingServiceOrder>>({
    queryKey: ['billing-service-orders-page', params],
    queryFn: async () => {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const queryParams: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };
      if (params.q) queryParams.q = params.q;
      if (params.status && params.status !== 'all') queryParams.status = params.status;
      if (params.billing && params.billing !== 'all') queryParams.billing = params.billing;

      const { data } = await api.get('/api/ordens-servico/faturamento/', { params: queryParams });
      if (isPaginatedResponse<BillingServiceOrder>(data)) {
        return {
          ...toPageResult(data, page, pageSize),
          items: data.results,
        };
      }

      const items = Array.isArray(data) ? (data as BillingServiceOrder[]) : [];
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

export type BillingKpis = {
  total_faturado: number;
  total_para_faturar: number;
  total_sem_liberacao: number;
};

export const useBillingKpis = () => {
  return useQuery({
    queryKey: ['billing-kpis'],
    queryFn: async () => {
      const { data } = await api.get<BillingKpis>('/api/financeiro/kpis/');
      return data;
    },
  });
};

export type MiniOsItem = {
  id: number;
  quantidade: number;
  descricao: string;
  data_recebimento: string | null;
  data_inicio: string | null;
  data_termino: string | null;
  status: string;
  faturamento: string | null;
  n_nf: string | null;
  cliente: {
    id: number;
    nome: string;
    tipo_cliente: string | null;
    cliente_ativo: string | null;
  } | null;
  servico: {
    id: number;
    nome: string;
    descricao: string | null;
  } | null;
  profile: {
    id: number;
    username: string;
    role: number;
  } | null;
};

export const useMiniOs = () => {
  return useQuery({
    queryKey: ['mini-os'],
    queryFn: async () => {
      const { data } = await api.get<MiniOsItem[]>('/api/minios/os-rapidas/');
      return data ?? [];
    },
  });
};

export type MiniOsPageParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  billing?: string;
};

export const useMiniOsPage = (params: MiniOsPageParams) => {
  return useQuery<PageResult<MiniOsItem>>({
    queryKey: ['mini-os-page', params],
    queryFn: async () => {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const queryParams: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };
      if (params.q) queryParams.q = params.q;
      if (params.billing && params.billing !== 'all') queryParams.billing = params.billing;

      const { data } = await api.get('/api/minios/os-rapidas/', { params: queryParams });
      if (isPaginatedResponse<MiniOsItem>(data)) {
        return {
          ...toPageResult(data, page, pageSize),
          items: data.results,
        };
      }

      const items = Array.isArray(data) ? (data as MiniOsItem[]) : [];
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

export type MiniOsDetail = MiniOsItem;

export const useMiniOsDetail = (id?: number | string) => {
  return useQuery({
    queryKey: ['mini-os-detail', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('missing id');
      const { data } = await api.get<MiniOsDetail>(`/api/minios/${id}/`);
      return data;
    },
  });
};

export type MiniOsUpdatePayload = {
  faturamento?: string | null;
  n_nf?: string | null;
};

export const useUpdateMiniOs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number | string; payload: MiniOsUpdatePayload }) => {
      const { data } = await api.patch<MiniOsDetail>(`/api/minios/${id}/`, payload);
      return data;
    },
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['mini-os'] }),
        qc.invalidateQueries({ queryKey: ['mini-os-page'] }),
        qc.invalidateQueries({ queryKey: ['mini-os-detail', id] }),
      ]);
    },
  });
};
