import api from '@/services/api';
import { isPaginatedResponse, PageResult, toPageResult } from '@/services/pagination';

const endpoint = '/api/clientes/clientes/';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  address?: string;
  notes?: string;
  tipo_inscricao?: 'cnpj' | 'cpf' | 'cei' | 'cno' | 'caepf' | 'outro';
  active?: boolean;
  chargeRevisionChange?: boolean;
  tipoCliente?: string;
  representativeName?: string;
  representativeSector?: string;
  representativeEmail?: string;
  representativeContact?: string;
  createdAt?: string;
}

export interface Contact {
  id: string;
  cliente: string;
  nome: string;
  email: string;
  telefone: string;
  setor?: string;
  funcao?: string;
}

type ClienteApi = {
  id: string | number;
  nome: string;
  tipo_inscricao: 'cnpj' | 'cpf' | 'cei' | 'cno' | 'caepf' | 'outro';
  numero_inscricao: string;
  ativo?: boolean;
  cobranca_revisao_alteracao?: boolean;
  tipo_cliente?: string;
  observacao?: string | null;
  data_criacao?: string;
  nome_representante?: string;
  setor_representante?: string;
  email_representante?: string;
  contato_representante?: string;
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
  ativo?: boolean;
  cobranca_revisao_alteracao?: boolean;
};

const toClient = (c: ClienteApi): Client => ({
  id: String(c.id),
  name: (c.nome || '').toUpperCase(),
  email: c.email_representante || '',
  document: c.numero_inscricao,
  tipo_inscricao: c.tipo_inscricao,
  address: '',
  active: !!c.ativo,
  chargeRevisionChange: !!c.cobranca_revisao_alteracao,
  tipoCliente: c.tipo_cliente,
  notes: c.observacao || undefined,
  createdAt: c.data_criacao,
  representativeName: c.nome_representante,
  representativeSector: c.setor_representante,
  representativeEmail: c.email_representante,
  representativeContact: c.contato_representante,
});

export const getClients = async (): Promise<Client[]> => {
  const { data } = await api.get<ClienteApi[]>(endpoint);
  return (data || [])
    .map(toClient)
    .sort((a, b) => a.name.localeCompare(b.name));
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

export const getClient = async (id: string): Promise<Client> => {
  const { data } = await api.get<ClienteApi>(`${endpoint}${id}/`);
  return toClient(data);
};

export const upsertClient = async (payload: ClienteUpsertPayload): Promise<Client> => {
  if (payload.id) {
    const { id, ...body } = payload;
    const { data } = await api.patch<ClienteApi>(`${endpoint}${id}/`, body);
    return toClient(data);
  }
  const { data } = await api.post<ClienteApi>(endpoint, payload);
  return toClient(data);
};

export const deleteClient = async (id: string): Promise<string> => {
  await api.delete(`${endpoint}${id}/`);
  return id;
};

// ── Contatos são representantes do cliente — campo embarcado no modelo Cliente ──
// Endpoint de lista usa ClienteListSerializer (sem campos de representante);
// o endpoint de detalhe usa ClienteSerializer (campos completos).

type ClienteDetalhe = {
  id: string | number;
  nome_representante?: string | null;
  setor_representante?: string | null;
  email_representante?: string | null;
  contato_representante?: string | null;
};

export type ContactApiInput = {
  cliente: number;
  nome: string;
  email: string;
  telefone: string;
  setor?: string;
  funcao?: string;
};

const toContact = (c: ClienteDetalhe): Contact => ({
  id: String(c.id),
  cliente: String(c.id),
  nome: c.nome_representante ?? '',
  email: c.email_representante ?? '',
  telefone: c.contato_representante ?? '',
  setor: c.setor_representante ?? undefined,
  funcao: undefined,
});

export const getContacts = async (): Promise<Contact[]> => {
  const { data } = await api.get<ClienteDetalhe[]>(endpoint, { params: { page_size: 500 } });
  return (Array.isArray(data) ? data : [])
    .filter(c => c.nome_representante)
    .map(toContact);
};

export const getContact = async (id: string): Promise<Contact> => {
  const { data } = await api.get<ClienteDetalhe>(`${endpoint}${id}/`);
  return toContact(data);
};

export const upsertContact = async (payload: ContactApiInput & { id?: string }): Promise<Contact> => {
  const clientId = payload.id ?? String(payload.cliente);
  const body = {
    nome_representante: payload.nome,
    email_representante: payload.email,
    contato_representante: payload.telefone,
    setor_representante: payload.setor ?? '',
  };
  const { data } = await api.patch<ClienteDetalhe>(`${endpoint}${clientId}/`, body);
  return toContact(data);
};

export const deleteContact = async (id: string): Promise<string> => {
  await api.patch(`${endpoint}${id}/`, {
    nome_representante: '',
    email_representante: '',
    contato_representante: '',
    setor_representante: '',
  });
  return id;
};
