import api from '@/services/api';
import { isPaginatedResponse, PageResult, toPageResult } from '@/services/pagination';

const ENDPOINT = '/api/tarefas/mini-os/';
const CATALOG_ENDPOINT = '/api/tarefas/repositorios/';

// ── Types ────────────────────────────────────────────────────────────────────

export interface OperationalOrderItem {
  id: number;
  clienteId: number;
  clienteNome: string;
  servicoId: number;
  servicoNome: string;
  responsavelId: number;
  responsavelNome: string;
  status: string;
  statusDisplay: string;
  faturada: boolean;
  dataRecebimento: string | null;
}

export interface OperationalOrderDetail extends OperationalOrderItem {
  clienteDetalhe: { id: number; nome: string; tipoCliente: string | null } | null;
  servicoDetalhe: { id: number; nome: string; descricao: string | null } | null;
  quantidade: number;
  descricao: string | null;
  dataInicio: string | null;
  dataTermino: string | null;
  revisaoCliente: boolean;
  geraCobranca: boolean;
  dataLiberacaoCobranca: string | null;
  numeroNf: string | null;
  faturadaPorNome: string | null;
  criadaEm: string;
  atualizadoEm: string;
}

export interface OperationalOrderCatalogItem {
  id: number;
  nome: string;
  descricao: string | null;
}

export interface CreateOperationalOrderPayload {
  cliente: number;
  servico: number;
  responsavel?: number;
  quantidade: number;
  descricao?: string | null;
  dataRecebimento: string;
  dataInicio?: string | null;
  dataTermino?: string | null;
  status?: string;
  revisaoCliente?: boolean;
}

export interface UpdateOperationalOrderPayload {
  cliente?: number;
  servico?: number;
  responsavel?: number;
  quantidade?: number;
  descricao?: string | null;
  dataRecebimento?: string;
  dataInicio?: string | null;
  dataTermino?: string | null;
  status?: string;
  revisaoCliente?: boolean;
  faturada?: boolean;
  numeroNf?: string | null;
}

export interface OperationalOrderListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  faturada?: string;
  responsavel?: number;
  cliente?: number;
}

export interface OperationalOrderCatalogPageParams {
  page?: number;
  pageSize?: number;
  q?: string;
}

// ── Normalization ─────────────────────────────────────────────────────────────

const normalizeItem = (dto: any): OperationalOrderItem => ({
  id: dto.id,
  clienteId: dto.cliente,
  clienteNome: dto.cliente_nome ?? '',
  servicoId: dto.servico,
  servicoNome: dto.servico_nome ?? '',
  responsavelId: dto.responsavel,
  responsavelNome: dto.responsavel_nome ?? '',
  status: dto.status ?? 'nao_iniciado',
  statusDisplay: dto.status_display ?? '',
  faturada: Boolean(dto.faturada),
  dataRecebimento: dto.data_recebimento ?? null,
});

const normalizeDetail = (dto: any): OperationalOrderDetail => ({
  ...normalizeItem(dto),
  clienteDetalhe: dto.cliente_detail
    ? { id: dto.cliente_detail.id, nome: dto.cliente_detail.nome, tipoCliente: dto.cliente_detail.tipo_cliente ?? null }
    : null,
  servicoDetalhe: dto.servico_detail
    ? { id: dto.servico_detail.id, nome: dto.servico_detail.nome, descricao: dto.servico_detail.descricao ?? null }
    : null,
  quantidade: Number(dto.quantidade ?? 1),
  descricao: dto.descricao ?? null,
  dataInicio: dto.data_inicio ?? null,
  dataTermino: dto.data_termino ?? null,
  revisaoCliente: Boolean(dto.revisao_cliente),
  geraCobranca: Boolean(dto.gera_cobranca),
  dataLiberacaoCobranca: dto.data_liberacao_cobranca ?? null,
  numeroNf: dto.numero_nf ?? null,
  faturadaPorNome: dto.faturada_por_nome ?? null,
  criadaEm: dto.criada_em ?? '',
  atualizadoEm: dto.atualizado_em ?? '',
});

// ── Operational Order functions ───────────────────────────────────────────────

export const getOperationalOrderList = async (): Promise<OperationalOrderItem[]> => {
  const { data } = await api.get(ENDPOINT);
  return (Array.isArray(data) ? data : []).map(normalizeItem);
};

export const getOperationalOrderPage = async (
  params: OperationalOrderListParams,
): Promise<PageResult<OperationalOrderItem>> => {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const queryParams: Record<string, string | number> = { page, page_size: pageSize };
  if (params.q) queryParams.q = params.q;
  if (params.status && params.status !== 'all') queryParams.status = params.status;
  if (params.faturada !== undefined) queryParams.faturada = params.faturada;
  if (params.responsavel) queryParams.responsavel = params.responsavel;
  if (params.cliente) queryParams.cliente = params.cliente;

  const { data } = await api.get(ENDPOINT, { params: queryParams });
  if (isPaginatedResponse<any>(data)) {
    return { ...toPageResult(data, page, pageSize), items: data.results.map(normalizeItem) };
  }
  const items = (Array.isArray(data) ? data : []).map(normalizeItem);
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

export const getOperationalOrderDetail = async (id: number): Promise<OperationalOrderDetail> => {
  const { data } = await api.get(`${ENDPOINT}${id}/`);
  return normalizeDetail(data);
};

export const createOperationalOrder = async (
  payload: CreateOperationalOrderPayload,
): Promise<OperationalOrderDetail> => {
  const { data } = await api.post(ENDPOINT, {
    cliente: payload.cliente,
    servico: payload.servico,
    responsavel: payload.responsavel,
    quantidade: payload.quantidade,
    descricao: payload.descricao ?? null,
    data_recebimento: payload.dataRecebimento,
    data_inicio: payload.dataInicio ?? null,
    data_termino: payload.dataTermino ?? null,
    status: payload.status ?? 'nao_iniciado',
    revisao_cliente: payload.revisaoCliente ?? false,
  });
  return normalizeDetail(data);
};

export const updateOperationalOrder = async (
  id: number,
  payload: UpdateOperationalOrderPayload,
): Promise<OperationalOrderDetail> => {
  const body: Record<string, any> = {};
  if (payload.cliente !== undefined) body.cliente = payload.cliente;
  if (payload.servico !== undefined) body.servico = payload.servico;
  if (payload.responsavel !== undefined) body.responsavel = payload.responsavel;
  if (payload.quantidade !== undefined) body.quantidade = payload.quantidade;
  if (payload.descricao !== undefined) body.descricao = payload.descricao;
  if (payload.dataRecebimento !== undefined) body.data_recebimento = payload.dataRecebimento;
  if (payload.dataInicio !== undefined) body.data_inicio = payload.dataInicio;
  if (payload.dataTermino !== undefined) body.data_termino = payload.dataTermino;
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.revisaoCliente !== undefined) body.revisao_cliente = payload.revisaoCliente;
  if (payload.faturada !== undefined) body.faturada = payload.faturada;
  if (payload.numeroNf !== undefined) body.numero_nf = payload.numeroNf;
  const { data } = await api.patch(`${ENDPOINT}${id}/`, body);
  return normalizeDetail(data);
};

export const deleteOperationalOrder = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}${id}/`);
};

// ── Catalog functions ─────────────────────────────────────────────────────────

export const getOperationalOrderCatalog = async (): Promise<OperationalOrderCatalogItem[]> => {
  const { data } = await api.get<OperationalOrderCatalogItem[]>(CATALOG_ENDPOINT);
  return Array.isArray(data) ? data : [];
};

export const getOperationalOrderCatalogPage = async (
  params: OperationalOrderCatalogPageParams,
): Promise<PageResult<OperationalOrderCatalogItem>> => {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const queryParams: Record<string, string | number> = { page, page_size: pageSize };
  if (params.q) queryParams.q = params.q;

  const { data } = await api.get(CATALOG_ENDPOINT, { params: queryParams });
  if (isPaginatedResponse<OperationalOrderCatalogItem>(data)) {
    return { ...toPageResult(data, page, pageSize), items: data.results };
  }
  const items = Array.isArray(data) ? (data as OperationalOrderCatalogItem[]) : [];
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

export const getOperationalOrderCatalogItem = async (id: number): Promise<OperationalOrderCatalogItem> => {
  const { data } = await api.get<OperationalOrderCatalogItem>(`${CATALOG_ENDPOINT}${id}/`);
  return data;
};

export const createOperationalOrderCatalogItem = async (payload: {
  nome: string;
  descricao?: string | null;
}): Promise<OperationalOrderCatalogItem> => {
  const { data } = await api.post<OperationalOrderCatalogItem>(CATALOG_ENDPOINT, payload);
  return data;
};

export const updateOperationalOrderCatalogItem = async (
  id: number,
  payload: { nome?: string; descricao?: string | null },
): Promise<OperationalOrderCatalogItem> => {
  const { data } = await api.patch<OperationalOrderCatalogItem>(`${CATALOG_ENDPOINT}${id}/`, payload);
  return data;
};

export const deleteOperationalOrderCatalogItem = async (id: number): Promise<void> => {
  await api.delete(`${CATALOG_ENDPOINT}${id}/`);
};
