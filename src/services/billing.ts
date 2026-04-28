import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { isPaginatedResponse, PageResult, toPageResult } from './pagination';

const ordensEndpoint = '/api/ordem-servico/ordens/';
const miniOsEndpoint = '/api/tarefas/mini-os/';

export type BillingServiceOrder = {
  id: number;
  cliente: number;
  cliente_nome: string;
  valor: number | string;
  forma_pagamento: string | null;
  forma_pagamento_display?: string;
  cobranca_imediata: boolean;
  faturada: boolean;
  data_faturamento: string | null;
  numero_nf: number | null;
  concluida: boolean;
  data_criacao: string;
};

export const useBillingServiceOrders = () => {
  return useQuery({
    queryKey: ['billing-service-orders'],
    queryFn: async () => {
      const { data } = await api.get<BillingServiceOrder[]>(ordensEndpoint, {
        params: { faturada: 'false' },
      });
      return Array.isArray(data) ? data : [];
    },
  });
};

export type BillingOrdersPageParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  concluida?: string;
  faturada?: string;
  liberada?: string;
};

export const useBillingServiceOrdersPage = (params: BillingOrdersPageParams) => {
  return useQuery<PageResult<BillingServiceOrder>>({
    queryKey: ['billing-service-orders-page', params],
    queryFn: async () => {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const queryParams: Record<string, string | number> = { page, page_size: pageSize };
      if (params.q) queryParams.q = params.q;
      if (params.faturada && params.faturada !== 'all') queryParams.faturada = params.faturada;
      if (params.concluida && params.concluida !== 'all') queryParams.concluida = params.concluida;
      if (params.liberada) queryParams.liberada = params.liberada;

      const { data } = await api.get(ordensEndpoint, { params: queryParams });
      if (isPaginatedResponse<BillingServiceOrder>(data)) {
        return { ...toPageResult(data, page, pageSize), items: data.results };
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
      const { data } = await api.get<BillingKpis>('/api/analise/financeiro/kpis/');
      return data;
    },
  });
};

// Campos retornados pelo MiniOSListSerializer (endpoint de lista)
export type MiniOsItem = {
  id: number;
  cliente: number;
  cliente_nome: string;
  servico: number;
  servico_nome: string;
  responsavel: number;
  responsavel_nome: string;
  status: string;
  status_display: string;
  faturada: boolean;
  data_recebimento: string | null;
};

// Campos retornados pelo MiniOSSerializer (endpoint de detalhe)
export type MiniOsDetail = {
  id: number;
  cliente: number;
  cliente_detail?: { id: number; nome: string; tipo_cliente: string | null } | null;
  servico: number;
  servico_detail?: { id: number; nome: string; descricao: string | null } | null;
  responsavel: number;
  responsavel_nome: string;
  quantidade: number;
  descricao: string | null;
  data_recebimento: string | null;
  data_inicio: string | null;
  data_termino: string | null;
  status: string;
  status_display: string;
  revisao_cliente: boolean;
  faturada: boolean;
  numero_nf: string | null;
};

export const useMiniOs = () => {
  return useQuery({
    queryKey: ['mini-os'],
    queryFn: async () => {
      const { data } = await api.get<MiniOsItem[]>(miniOsEndpoint, {
        params: { faturada: 'false' },
      });
      return data ?? [];
    },
  });
};

export type MiniOsPageParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  faturada?: string;
};

export const useMiniOsPage = (params: MiniOsPageParams) => {
  return useQuery<PageResult<MiniOsItem>>({
    queryKey: ['mini-os-page', params],
    queryFn: async () => {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 20;
      const queryParams: Record<string, string | number> = { page, page_size: pageSize };
      if (params.q) queryParams.q = params.q;
      if (params.faturada && params.faturada !== 'all') queryParams.faturada = params.faturada;

      const { data } = await api.get(miniOsEndpoint, { params: queryParams });
      if (isPaginatedResponse<MiniOsItem>(data)) {
        return { ...toPageResult(data, page, pageSize), items: data.results };
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

export const useMiniOsDetail = (id?: number | string) => {
  return useQuery({
    queryKey: ['mini-os-detail', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('missing id');
      const { data } = await api.get<MiniOsDetail>(`${miniOsEndpoint}${id}/`);
      return data;
    },
  });
};

export type MiniOsUpdatePayload = {
  faturada?: boolean;
  numero_nf?: string | null;
};

export const useUpdateMiniOs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number | string; payload: MiniOsUpdatePayload }) => {
      const { data } = await api.patch<MiniOsDetail>(`${miniOsEndpoint}${id}/`, payload);
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
