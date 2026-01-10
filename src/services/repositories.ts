import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { RepositoryItem } from '@/types';

type RepositorioDTO = {
  id: number | string;
  nome: string;
  descricao: string;
};

const endpoint = '/api/repositorios/';

const toFrontend = (dto: RepositorioDTO): RepositoryItem => ({
  id: String(dto.id),
  name: dto.nome,
  description: dto.descricao,
});

const toBackend = (item: Partial<RepositoryItem>) => ({
  nome: item.name ?? '',
  descricao: item.description ?? '',
});

export const useRepositories = () => {
  return useQuery<RepositoryItem[]>({
    queryKey: ['repositories'],
    queryFn: async () => {
      const { data } = await api.get<RepositorioDTO[]>(endpoint);
      return (data || []).map(toFrontend);
    },
  });
};

export const useRepository = (id?: string) => {
  return useQuery<RepositoryItem>({
    queryKey: ['repository', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<RepositorioDTO>(`${endpoint}${id}/`);
      return toFrontend(data);
    },
  });
};

export const useUpsertRepository = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<RepositoryItem> & { id?: string }) => {
      if (payload.id) {
        const { id, ...body } = payload;
        const { data } = await api.put<RepositorioDTO>(`${endpoint}${id}/`, toBackend(body));
        return toFrontend(data);
      }
      const { data } = await api.post<RepositorioDTO>(endpoint, toBackend(payload));
      return toFrontend(data);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
};

export const useDeleteRepository = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${endpoint}${id}/`);
      return id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['repositories'] });
    },
  });
};
