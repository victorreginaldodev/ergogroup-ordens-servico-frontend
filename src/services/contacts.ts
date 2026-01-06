import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Contact } from '@/types';

const endpoint = '/api/contatos/';

type ContactApi = {
  id: string | number;
  cliente: number;
  nome: string;
  email: string;
  telefone: string;
  setor?: string;
  funcao?: string;
};

export type ContactApiInput = Omit<ContactApi, 'id'>;

const toContact = (c: ContactApi): Contact => ({
  id: String(c.id),
  cliente: String(c.cliente),
  nome: c.nome,
  email: c.email,
  telefone: c.telefone,
  setor: c.setor,
  funcao: c.funcao,
});

export const getContacts = async (): Promise<Contact[]> => {
  const { data } = await api.get<ContactApi[]>(endpoint);
  return (data || []).map(toContact);
};

export const useContacts = () => {
  return useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: async () => getContacts(),
  });
};

export const getContact = async (id: string): Promise<Contact> => {
  const { data } = await api.get<ContactApi>(`${endpoint}${id}/`);
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
      if (payload.id) {
        const { id, ...body } = payload as any;
        const { data } = await api.put<ContactApi>(`${endpoint}${id}/`, body);
        return toContact(data);
      }
      const { data } = await api.post<ContactApi>(endpoint, payload);
      return toContact(data);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

export const useDeleteContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${endpoint}${id}/`);
      return id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
};

