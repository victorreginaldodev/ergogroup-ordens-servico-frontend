import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Contact } from '@/types';

// Contatos são representantes do cliente — campo embarcado no modelo Cliente.
// Endpoint de lista usa ClienteListSerializer (sem campos de representante);
// o endpoint de detalhe usa ClienteSerializer (campos completos).
const endpoint = '/api/clientes/clientes/';

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

export const useContacts = () => {
  return useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: async () => getContacts(),
  });
};

export const getContact = async (id: string): Promise<Contact> => {
  const { data } = await api.get<ClienteDetalhe>(`${endpoint}${id}/`);
  return toContact(data);
};

export const useContact = (id?: string) => {
  return useQuery<Contact>({
    queryKey: ['contact', id],
    queryFn: async () => {
      if (!id) throw new Error('missing id');
      return getContact(id);
    },
    enabled: !!id,
  });
};

export const useUpsertContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ContactApiInput & { id?: string }) => {
      const clientId = payload.id ?? String(payload.cliente);
      const body = {
        nome_representante: payload.nome,
        email_representante: payload.email,
        contato_representante: payload.telefone,
        setor_representante: payload.setor ?? '',
      };
      const { data } = await api.patch<ClienteDetalhe>(`${endpoint}${clientId}/`, body);
      return toContact(data);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['contacts'] });
      await qc.invalidateQueries({ queryKey: ['clients'] });
      await qc.invalidateQueries({ queryKey: ['clientsPage'] });
    },
  });
};

export const useDeleteContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`${endpoint}${id}/`, {
        nome_representante: '',
        email_representante: '',
        contato_representante: '',
        setor_representante: '',
      });
      return id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['contacts'] });
      await qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};
