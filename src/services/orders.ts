import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { ServiceItem, ServiceOrder } from '@/types';

const endpoint = '/api/ordens-servico/';

export type OrdemServicoItemDTO = {
  id?: number;
  catalogo_servico: number;
  catalogo?: {
    id: number;
    nome?: string;
  };
  valor?: string | number; // Changed from valor_servico to valor
  valor_servico?: string | number; // For backward compatibility if needed for reading
  quantidade: number;
  descricao?: string;
};

export type OrdemFaturamentoDTO = {
  forma_pagamento?: string;
  qtde_parcelas?: number;
  nome_contato_envio_nf?: string;
  contato_envio_nf?: string;
  descricao_faturamento?: string;
  faturamento_liberado?: boolean;
};

export type OrdemServicoDTO = {
  id: string | number;
  cliente: number | {
    id: number;
    nome?: string;
  };
  data_venda: string;
  valor_total: string | number;
  status: string;
  servicos: OrdemServicoItemDTO[];
  
  forma_pagamento?: string;
  qtde_parcelas?: number;
  nome_contato_envio_nf?: string;
  email_envio_nf?: string;
  observacao_faturamento?: string;
  liberar_faturamento?: boolean;

  faturamento?: OrdemFaturamentoDTO;
};

export interface OrdemServicoDetailNew {
  id: number;
  servicos: {
    id: number;
    repositorio?: {
      nome?: string;
      id?: number;
    };
    descricao?: string;
    tarefas?: any[];
    status?: string;
    data_conclusao?: string | null;
  }[];
  usuario_criador?: string;
  data_criacao: string;
  valor: number;
  forma_pagamento: 'pix' | 'credito' | 'debto' | 'boleto' | 'transferencia' | 'dinheiro' | 'check' | 'outro';
  quantidade_parcelas: number | null;
  cobranca_imediata: 'sim' | 'nao';
  faturamento_1: string | null;
  nome_contato_envio_nf: string;
  contato_envio_nf: string;
  observacao: string | null;
  concluida: 'sim' | 'nao';
  faturamento: 'sim' | 'nao';
  numero_nf: number | null;
  data_faturamento: string | null;
  cliente: {
    id: number;
    nome: string;
  };
}

export type OrdemServicoInput = {
  servicos: {
    repositorio_id: number;
    descricao: string;
  }[];
  data_criacao: string;
  valor: number;
  forma_pagamento: 'pix' | 'credito' | 'debto' | 'boleto' | 'transferencia' | 'dinheiro' | 'check' | 'outro';
  quantidade_parcelas?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  cobranca_imediata?: 'sim' | 'nao';
  faturamento_1?: string;
  nome_contato_envio_nf: string;
  contato_envio_nf: string;
  observacao?: string;
  cliente: number;
};

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

const toLocalDate = (s?: string): Date => {
  if (!s) return new Date();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(y, mo, d);
  }
  return new Date(s);
};

const toServiceItem = (i: OrdemServicoItemDTO, idx: number): ServiceItem => ({
  id: String(idx + 1),
  serviceId: String(i.catalogo?.id || i.catalogo_servico),
  serviceName: i.catalogo?.nome || '',
  quantity: Number(i.quantidade ?? 1),
  unitPrice: Number(i.valor ?? i.valor_servico ?? 0),
  total: Number((Number(i.valor ?? i.valor_servico) ?? 0) * (i.quantidade ?? 1)),
  status: 'pending',
  note: i.descricao,
});

const toFrontend = (dto: OrdemServicoDTO): ServiceOrder => {
  const created = dto.data_venda ? toLocalDate(dto.data_venda) : new Date();
  const due = created;
  const items = (dto.servicos || []).map(toServiceItem);
  const totalAmount = Number(dto.valor_total ?? items.reduce((acc, it) => acc + (Number.isFinite(it.total) ? it.total : 0), 0));
  
  const clientName = typeof dto.cliente === 'object' ? (dto.cliente?.nome || String(dto.cliente?.id || '')) : String(dto.cliente);

  return {
    id: String(dto.id),
    orderNumber: `OS-${dto.id}`,
    clientName,
    clientEmail: '',
    clientPhone: '',
    description: '',
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
  const first: any = list[0] as any;
  const isListFormat = 'cliente_nome' in first;
  const isNewFormat = 'data_criacao' in first || 'concluida' in first || ('cliente' in first && typeof first.cliente === 'object');
  if (isListFormat) {
    const toFrontendListItem = (dto: OrdemServicoListItemDTO): ServiceOrder => {
      const created = dto.data ? toLocalDate(dto.data) : new Date();
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
  if (isNewFormat) {
    const toFrontendNew = (dto: any): ServiceOrder => {
      const created = dto.data_criacao ? toLocalDate(dto.data_criacao) : new Date();
      const totalAmount = Number(dto.valor ?? 0);
      const clientName =
        dto.cliente?.nome ??
        (typeof dto.cliente === 'string' ? dto.cliente : '') ??
        '';
      const concluidaRaw: string = (dto.concluida || '').toLowerCase();
      const status: ServiceOrder['status'] =
        concluidaRaw === 'sim' ? 'completed' :
        concluidaRaw === 'nao' ? 'in_progress' :
        mapStatus(dto.status || 'nao_iniciado');
      const faturadoRaw: string = (dto.faturamento || '').toLowerCase();
      const isPaid = faturadoRaw === 'sim' || !!dto.numero_nf;
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
        isPaid,
      };
    };
    return (list as any[]).map(toFrontendNew);
  }
  return (list as OrdemServicoDTO[]).map(toFrontend);
};

export const useServiceOrders = () => {
  return useQuery<ServiceOrder[]>({
    queryKey: ['serviceOrders'],
    queryFn: async () => getServiceOrders(),
  });
};

export const getServiceOrder = async (id: string): Promise<OrdemServicoDetailNew> => {
  const { data } = await api.get<OrdemServicoDetailNew>(`${endpoint}${id}/`);
  return data;
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

export type OrdemServicoBillingUpdate = {
  faturamento?: 'sim' | 'nao' | null;
  data_faturamento?: string | null;
  numero_nf?: number | null;
};

export const useUpdateServiceOrderBilling = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string | number; payload: OrdemServicoBillingUpdate }) => {
      const { data } = await api.patch<OrdemServicoDetailNew>(`${endpoint}${id}/`, payload);
      return data;
    },
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['serviceOrder', String(id)] }),
        qc.invalidateQueries({ queryKey: ['billing-service-orders'] }),
      ]);
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
