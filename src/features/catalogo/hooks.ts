import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageResult } from '@/services/pagination';
import {
  RepositoryItem,
  RepositoriesPageParams,
  getRepositories,
  getRepositoriesPage,
  getRepository,
  upsertRepository,
  deleteRepository,
} from './services';

export const useRepositories = () =>
  useQuery<RepositoryItem[]>({
    queryKey: ['catalogo-lista'],
    queryFn: getRepositories,
  });

export const useRepositoriesPage = (params: RepositoriesPageParams) =>
  useQuery<PageResult<RepositoryItem>>({
    queryKey: ['catalogo-lista-paginada', params],
    queryFn: () => getRepositoriesPage(params),
  });

export const useRepository = (id?: string) =>
  useQuery<RepositoryItem>({
    queryKey: ['catalogo-detalhe', id],
    enabled: !!id,
    queryFn: () => getRepository(id as string),
  });

export const useUpsertRepository = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: upsertRepository,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['catalogo-lista'] });
      await qc.invalidateQueries({ queryKey: ['catalogo-lista-paginada'] });
    },
  });
};

export const useDeleteRepository = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRepository,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['catalogo-lista'] });
      await qc.invalidateQueries({ queryKey: ['catalogo-lista-paginada'] });
    },
  });
};
