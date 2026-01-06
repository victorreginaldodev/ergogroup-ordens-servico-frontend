import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { ServiceItem, ServiceOrder } from '@/types';

const endpoint = '/api/ordens-servico/';

type OrdemServicoItemDTO = {
  catalogo_servico: number;
  quantidade: number;
  valor: number;
  descricao?: string;
};

type OrdemFaturamentoDTO = {
  faturar_em?: string;
  nao_faturavel?: boolean;
  faturamento_liberado?: boolean;
  nome_contato_envio_nf?: string;
  contato_envio_nf?: string;
  descricao_faturamento?: string;
  forma_pagamento?: string;
};

export type OrdemServicoDetailDTO = {
  id: number;
  cliente: {
    id: number;
    nome: string;
  };
  data_venda: string;
  valor_total: string;
  forma_pagamento: string;
  qtde_parcelas: number | null;
  tipo: string;
  status?: string;
  inicio_vigencia: string | null;
  fim_vigencia: string | null;
  renovacao_automatica: boolean;
  nome_contato_envio_nf: string;
  email_envio_nf: string;
  observacao_faturamento: string;
  nao_faturavel: boolean;
  liberar_faturamento: boolean;
  servicos: {
    id: number;
    catalogo: {
      id: number;
      nome: string;
    };
    valor_servico: string;
    quantidade: number;
    descricao: string;
  }[];
};

export type OrdemServicoDTO = {
  id: string | number;
  cliente: number;
  data_venda: string;
  tipo_ordem_servico: string;
  status: string;
  valor_total: number;
  servicos: OrdemServicoItemDTO[];
  faturamento?: OrdemFaturamentoDTO;
};

export type OrdemServicoInput = Omit<OrdemServicoDTO, 'id'>;

// Lista simples para página de listagem
type OrdemServicoListItemDTO = {
  id: number;
  cliente_nome: string;
  valor: string;
  status: string;
  data: string;
};

const mapStatus = (s: string): ServiceOrder['status'] => {
  const m: Record<string, ServiceOrder['status']> = {
    nao_iniciado: 'pending',
    em_andamento: 'in_progress',
    concluido: 'completed',
    cancelado: 'cancelled',
  };
  return m[s] ?? 'pending';
};

const toServiceItem = (i: OrdemServicoItemDTO, idx: number): ServiceItem => ({
  id: String(idx + 1),
  serviceId: String(i.catalogo_servico),
  serviceName: '',
  quantity: Number(i.quantidade ?? 1),
  unitPrice: Number(i.valor ?? 0),
  total: Number((i.valor ?? 0) * (i.quantidade ?? 1)),
  status: 'pending',
  note: i.descricao,
});

const toFrontend = (dto: OrdemServicoDTO): ServiceOrder => {
  const created = dto.data_venda ? new Date(dto.data_venda) : new Date();
  const due = dto.faturamento?.faturar_em ? new Date(dto.faturamento.faturar_em) : created;
  const items = (dto.servicos || []).map(toServiceItem);
  const totalAmount = Number(dto.valor_total ?? items.reduce((acc, it) => acc + (Number.isFinite(it.total) ? it.total : 0), 0));
  return {
    id: String(dto.id),
    orderNumber: `OS-${dto.id}`,
    clientName: String(dto.cliente),
    clientEmail: '',
    clientPhone: '',
    description: dto.tipo_ordem_servico,
    services: items,
    status: mapStatus(dto.status),
    totalAmount,
    createdAt: created,
    updatedAt: created,
    dueDate: due,
  isPaid: false,
};
};

export const getServiceOrders = async (): Promise<ServiceOrder[]> => {
  const { data } = await api.get<(OrdemServicoDTO | OrdemServicoListItemDTO)[]>(endpoint);
  const list = Array.isArray(data) ? data : [];
  if (list.length === 0) return [];
  // Detecta formato da lista simples pela presença de 'cliente_nome'
  const isListFormat = 'cliente_nome' in (list[0] as any);
  if (isListFormat) {
    const toFrontendListItem = (dto: OrdemServicoListItemDTO): ServiceOrder => {
      const created = dto.data ? new Date(dto.data) : new Date();
      const totalAmount = Number(dto.valor ?? 0);
      return {
        id: String(dto.id),
        orderNumber: `OS-${dto.id}`,
        clientName: dto.cliente_nome,
        clientEmail: '',
        clientPhone: '',
        description: '',
        services: [],
        status: mapStatus(dto.status),
        totalAmount,
        createdAt: created,
        updatedAt: created,
        dueDate: created,
        isPaid: false,
      };
    };
    return (list as OrdemServicoListItemDTO[]).map(toFrontendListItem);
  }
  return (list as OrdemServicoDTO[]).map(toFrontend);
};

export const useServiceOrders = () => {
  return useQuery<ServiceOrder[]>({
    queryKey: ['serviceOrders'],
    queryFn: async () => getServiceOrders(),
  });
};

export const getServiceOrder = async (id: string): Promise<OrdemServicoDetailDTO> => {
  const { data } = await api.get<OrdemServicoDetailDTO>(`${endpoint}${id}/`);
  return data;
};

export const useServiceOrder = (id?: string) => {
  return useQuery<OrdemServicoDetailDTO>({
    queryKey: ['serviceOrder', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('missing id');
      return getServiceOrder(id);
    },
  });
};

export const useUpsertServiceOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: OrdemServicoInput & { id?: string | number }) => {
      if (payload.id) {
        const { id, ...body } = payload;
        const { data } = await api.put<OrdemServicoDTO>(`${endpoint}${id}/`, body);
        return data;
      }
      const { data } = await api.post<OrdemServicoDTO>(endpoint, payload);
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceOrders'] });
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
    },
  });
};
