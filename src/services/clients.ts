import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Client } from '@/types';
import api from './api';

const endpoint = '/api/clientes/';

type ClienteApi = {
  id: string | number;
  nome: string;
  tipo_inscricao: 'cnpj' | 'cpf' | 'cei' | 'cno' | 'caepf' | 'outro';
  numero_inscricao: string;
  telefone_institucional: string;
  email_institucional: string;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
};

export type ClienteApiInput = Omit<ClienteApi, 'id'>;

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
    name: c.nome,
    email: c.email_institucional,
    phone: c.telefone_institucional,
    document: c.numero_inscricao,
    address,
    tipo_inscricao: c.tipo_inscricao,
  };
};

export const getClients = async (): Promise<Client[]> => {
  const { data } = await api.get<ClienteApi[]>(endpoint);
  return (data || []).map(toClient);
};

export const useClients = () => {
  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => getClients(),
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
    mutationFn: async (payload: ClienteApiInput & { id?: string }) => {
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
    },
  });
};
