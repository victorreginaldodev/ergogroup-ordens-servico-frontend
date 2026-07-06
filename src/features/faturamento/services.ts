import api from '@/services/api';
import { isPaginatedResponse, PageResult, toPageResult } from '@/services/pagination';

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
  liberada_para_faturamento_em?: string | null;
  liberada_para_faturamento_por_nome?: string | null;
};

export type BillingOrdersPageParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  concluida?: string;
  faturada?: string;
  liberada?: string;
};

export const getBillingServiceOrdersPage = async (
  params: BillingOrdersPageParams,
): Promise<PageResult<BillingServiceOrder>> => {
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
};

export type BillingKpis = {
  total_faturado: number;
  total_para_faturar: number;
  total_sem_liberacao: number;
};

export const getBillingKpis = async (): Promise<BillingKpis> => {
  const { data } = await api.get<BillingKpis>('/api/analise/financeiro/kpis/');
  return data;
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

export type MiniOsPageParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  faturada?: string;
};

export const getMiniOsPage = async (params: MiniOsPageParams): Promise<PageResult<MiniOsItem>> => {
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
};

export const getMiniOsDetail = async (id: number | string): Promise<MiniOsDetail> => {
  const { data } = await api.get<MiniOsDetail>(`${miniOsEndpoint}${id}/`);
  return data;
};

export type MiniOsUpdatePayload = {
  faturada?: boolean;
  numero_nf?: string | null;
};

export const updateMiniOs = async (
  id: number | string,
  payload: MiniOsUpdatePayload,
): Promise<MiniOsDetail> => {
  const { data } = await api.patch<MiniOsDetail>(`${miniOsEndpoint}${id}/`, payload);
  return data;
};
