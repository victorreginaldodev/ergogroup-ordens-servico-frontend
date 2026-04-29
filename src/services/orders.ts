import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { ServiceOrder } from '@/types';
import { isPaginatedResponse, PageResult, toPageResult } from './pagination';

const endpoint = '/api/ordem-servico/ordens/';
const servicosEndpoint = '/api/servicos/servicos/';

export type FormaPagamento =
  | 'pix'
  | 'credito'
  | 'debito'
  | 'boleto'
  | 'transferencia'
  | 'dinheiro'
  | 'cheque'
  | 'outro';

export interface OrdemServicoDetailNew {
  id: number;
  servicos: {
    id: number;
    catalogo?: { id?: number; nome?: string };
    repositorio?: { id?: number; nome?: string };
    catalogo_servico?: number;
    descricao?: string;
    tarefas?: any[];
    status?: string;
    data_conclusao?: string | null;
  }[];
  criado_por: number | null;
  data_criacao: string;
  data_atualizacao: string;
  valor: string | number;
  forma_pagamento: FormaPagamento;
  quantidade_parcelas: number | null;
  cobranca_imediata: boolean;
  nome_contato_envio_nf: string;
  contato_envio_nf: string;
  observacao: string | null;
  concluida: boolean;
  faturada: boolean;
  numero_nf: number | null;
  data_faturamento: string | null;
  cliente: number | { id: number; nome: string };
  cliente_detail?: {
    id: number;
    nome: string;
    nome_representante?: string;
    setor_representante?: string;
    email_representante?: string;
    contato_representante?: string;
  };
  criado_por_nome: string | null;
  data_conclusao_os: string | null;
  finalizador_nome: string | null;
}

export type OrdemServicoInput = {
  servicos?: {
    id?: number;
    repositorio_id: number;
    descricao: string;
  }[];
  servicosToDelete?: number[];
  data_criacao: string;
  valor: number;
  forma_pagamento: FormaPagamento;
  quantidade_parcelas?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  cobranca_imediata?: boolean;
  nome_contato_envio_nf: string;
  contato_envio_nf: string;
  observacao?: string;
  cliente: number;
};

export type OrdersPageParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  cliente?: number;
  concluida?: boolean;
  faturada?: boolean;
};

const toLocalDate = (s?: string): Date => {
  if (!s) return new Date();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(s);
};

const toFrontendNew = (dto: any): ServiceOrder => {
  const created = dto.data_criacao ? toLocalDate(dto.data_criacao) : new Date();
  const totalAmount = Number(dto.valor ?? 0);
  const clientName =
    dto.cliente_detail?.nome ??
    dto.cliente_nome ??
    (typeof dto.cliente === 'object' ? dto.cliente?.nome : '') ??
    '';
  const concluida = typeof dto.concluida === 'boolean' ? dto.concluida : dto.concluida === 'sim';
  const faturada = typeof dto.faturada === 'boolean' ? dto.faturada : dto.faturada === 'sim';
  const status: ServiceOrder['status'] = concluida ? 'completed' : 'in_progress';
  return {
    id: String(dto.id),
    orderNumber: `OS-${dto.id}`,
    clientName,
    clientEmail: '',
    clientPhone: '',
    description: dto.observacao || '',
    services: [],
    status,
    totalAmount,
    createdAt: created,
    updatedAt: created,
    dueDate: created,
    isPaid: faturada || !!dto.numero_nf,
  };
};

const normalizeServico = (s: any) => ({
  id: s.id,
  descricao: s.descricao || '',
  status: s.status,
  data_conclusao: s.data_conclusao ?? null,
  tarefas: [],
  catalogo: {
    id: s.repositorio_detail?.id ?? s.repositorio,
    nome: s.repositorio_detail?.nome ?? s.repositorio_nome ?? '',
  },
  repositorio: {
    id: s.repositorio_detail?.id ?? s.repositorio,
    nome: s.repositorio_detail?.nome ?? s.repositorio_nome ?? '',
  },
  catalogo_servico: s.repositorio,
});

export const getServiceOrders = async (): Promise<ServiceOrder[]> => {
  const { data } = await api.get<any>(endpoint, { params: { page_size: 500 } });
  const items = isPaginatedResponse<any>(data) ? data.results : (Array.isArray(data) ? data : []);
  return items.map(toFrontendNew);
};

export const useServiceOrders = () => {
  return useQuery<ServiceOrder[]>({
    queryKey: ['serviceOrders'],
    queryFn: getServiceOrders,
  });
};

export const getServiceOrdersPage = async (params: OrdersPageParams = {}): Promise<PageResult<ServiceOrder>> => {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const queryParams: Record<string, string | number> = { page, page_size: pageSize };

  if (params.q) queryParams.q = params.q;
  if (params.dateFrom) queryParams.date_from = params.dateFrom;
  if (params.dateTo) queryParams.date_to = params.dateTo;
  if (params.cliente) queryParams.cliente = params.cliente;
  if (params.concluida !== undefined) queryParams.concluida = String(params.concluida);
  if (params.faturada !== undefined) queryParams.faturada = String(params.faturada);

  const { data } = await api.get(endpoint, { params: queryParams });
  if (isPaginatedResponse<any>(data)) {
    return {
      ...toPageResult(data, page, pageSize),
      items: data.results.map(toFrontendNew),
    };
  }
  const items = (Array.isArray(data) ? data : []).map(toFrontendNew);
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

export const useServiceOrdersPage = (params: OrdersPageParams) => {
  return useQuery<PageResult<ServiceOrder>>({
    queryKey: ['serviceOrdersPage', params],
    queryFn: () => getServiceOrdersPage(params),
  });
};

export const getServiceOrder = async (id: string): Promise<OrdemServicoDetailNew> => {
  const [orderRes, servicosRes] = await Promise.all([
    api.get<OrdemServicoDetailNew>(`${endpoint}${id}/`),
    api.get<any>(servicosEndpoint, { params: { ordem_servico: id, page_size: 200 } }),
  ]);
  const servicos = isPaginatedResponse<any>(servicosRes.data)
    ? servicosRes.data.results
    : (Array.isArray(servicosRes.data) ? servicosRes.data : []);
  return { ...orderRes.data, servicos: servicos.map(normalizeServico) };
};

export const useServiceOrder = (id?: string) => {
  return useQuery<OrdemServicoDetailNew>({
    queryKey: ['serviceOrder', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('missing id');
      return getServiceOrder(id);
    },
  });
};

export const useOrdemServicoDetail = (id?: string) => {
  return useQuery<OrdemServicoDetailNew>({
    queryKey: ['ordemServicoDetail', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('missing id');
      const { data } = await api.get<OrdemServicoDetailNew>(`${endpoint}${id}/`);
      return data;
    },
  });
};

export type OrdemServicoBillingUpdate = {
  numero_nf?: number | null;
  data_faturamento?: string | null;
};

export const useUpdateServiceOrderBilling = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string | number; payload: OrdemServicoBillingUpdate }) => {
      const { data } = await api.patch<OrdemServicoDetailNew>(`${endpoint}${id}/faturar/`, payload);
      return data;
    },
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['serviceOrder', String(id)] }),
        qc.invalidateQueries({ queryKey: ['billing-service-orders'] }),
        qc.invalidateQueries({ queryKey: ['billing-service-orders-page'] }),
      ]);
    },
  });
};

export const useUpsertServiceOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OrdemServicoInput & { id?: string | number }) => {
      const { servicos: servicosPayload, servicosToDelete, id, ...orderBody } = payload;

      let orderData: OrdemServicoDetailNew;
      if (id) {
        const { data } = await api.patch<OrdemServicoDetailNew>(`${endpoint}${id}/`, orderBody);
        orderData = data;
      } else {
        const { data } = await api.post<OrdemServicoDetailNew>(endpoint, orderBody);
        orderData = data;
      }

      if (servicosToDelete && servicosToDelete.length > 0) {
        await Promise.all(
          servicosToDelete.map(svcId => api.delete(`${servicosEndpoint}${svcId}/`)),
        );
      }

      if (servicosPayload && servicosPayload.length > 0) {
        await Promise.all(
          servicosPayload.map(s =>
            s.id
              ? api.patch(`${servicosEndpoint}${s.id}/`, {
                  repositorio: s.repositorio_id,
                  descricao: s.descricao,
                })
              : api.post(servicosEndpoint, {
                  ordem_servico: orderData.id,
                  repositorio: s.repositorio_id,
                  descricao: s.descricao,
                }),
          ),
        );
      }

      return orderData;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceOrders'] });
      await qc.invalidateQueries({ queryKey: ['serviceOrdersPage'] });
      await qc.invalidateQueries({ queryKey: ['serviceOrder'] });
    },
  });
};

export const useDeleteServiceOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${endpoint}${id}/`);
      return id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceOrders'] });
      await qc.invalidateQueries({ queryKey: ['serviceOrdersPage'] });
    },
  });
};
