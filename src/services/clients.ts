import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Client } from '@/types';

import api from './api';
import { isPaginatedResponse, PageResult, toPageResult } from './pagination';

const endpoint = '/api/clientes/';

type ClienteApi = {
  id: string | number;
  nome: string;
  tipo_inscricao: 'cnpj' | 'cpf' | 'cei' | 'cno' | 'caepf' | 'outro';
  numero_inscricao: string;
  telefone_institucional?: string;
  email_institucional?: string;
  cliente_ativo?: string;
  cobranca_revisao_alteracao?: boolean;
  tipo_cliente?: string;
  observacao?: string | null;
  data_criacao?: string;
  nome_representante?: string;
  setor_representante?: string;
  email_representante?: string;
  contato_representante?: string;
  endereco?: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
};

export type ClienteApiInput = Omit<ClienteApi, 'id'>;

export type ClienteUpsertPayload = {
  id?: string;
  nome: string;
  tipo_inscricao: ClienteApi['tipo_inscricao'];
  numero_inscricao: string;
  tipo_cliente?: string;
  observacao?: string | null;
  nome_representante?: string;
  setor_representante?: string;
  email_representante?: string;
  contato_representante?: string;
  cliente_ativo?: 'sim' | 'nao';
  cobranca_revisao_alteracao?: boolean;
};

const toClient = (c: ClienteApi): Client => {
  const id = String(c.id);
  const address = [
    c.endereco?.rua,
    c.endereco?.numero ? `, ${c.endereco.numero}` : '',
    c.endereco?.bairro ? ` - ${c.endereco.bairro}` : '',
    c.endereco?.cidade && c.endereco?.uf ? `, ${c.endereco.cidade}/${c.endereco.uf}` : '',
    c.endereco?.cep ? `, ${c.endereco.cep}` : '',
  ]
    .filter(Boolean)
    .join('');
  return {
    id,
    name: c.nome.toUpperCase(),
    email: c.email_institucional,
    phone: c.telefone_institucional,
    document: c.numero_inscricao,
    tipo_inscricao: c.tipo_inscricao,
    address,
    active: (c.cliente_ativo || '').toLowerCase() === 'sim',
    chargeRevisionChange: !!c.cobranca_revisao_alteracao,
    tipoCliente: c.tipo_cliente,
    notes: c.observacao || undefined,
    createdAt: c.data_criacao,
    representativeName: c.nome_representante,
    representativeSector: c.setor_representante,
    representativeEmail: c.email_representante,
    representativeContact: c.contato_representante,
  };
};

export const getClients = async (): Promise<Client[]> => {
  const { data } = await api.get<ClienteApi[]>(endpoint);
  return (data || [])
    .map(toClient)
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const useClients = () => {
  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => getClients(),
  });
};

export type ClientsPageParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export const getClientsPage = async (
  params: ClientsPageParams = {},
): Promise<PageResult<Client>> => {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const queryParams: Record<string, string | number> = {
    page,
    page_size: pageSize,
  };
  if (params.q) queryParams.q = params.q;

  const { data } = await api.get(endpoint, { params: queryParams });
  if (isPaginatedResponse<ClienteApi>(data)) {
    return {
      ...toPageResult(data, page, pageSize),
      items: data.results.map(toClient),
    };
  }

  const items = (Array.isArray(data) ? data : []).map(toClient);
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

export const useClientsPage = (params: ClientsPageParams) => {
  return useQuery<PageResult<Client>>({
    queryKey: ['clientsPage', params],
    queryFn: () => getClientsPage(params),
  });
};

export const getClient = async (id: string): Promise<Client> => {
  const { data } = await api.get<ClienteApi>(`${endpoint}${id}/`);
  return toClient(data);
};

export const useClient = (id?: string) => {
  return useQuery<Client>({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!id) throw new Error('missing id');
      return getClient(id);
    },
    enabled: !!id,
  });
};

export const useUpsertClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ClienteUpsertPayload) => {
      if (payload.id) {
        const { id, ...body } = payload;
        const { data } = await api.put<ClienteApi>(`${endpoint}${id}/`, body);
        return toClient(data);
      }
      const { data } = await api.post<ClienteApi>(endpoint, payload);
      return toClient(data);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['clients'] });
      await qc.invalidateQueries({ queryKey: ['clientsPage'] });
    },
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${endpoint}${id}/`);
      return id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['clients'] });
      await qc.invalidateQueries({ queryKey: ['clientsPage'] });
    },
  });
};
