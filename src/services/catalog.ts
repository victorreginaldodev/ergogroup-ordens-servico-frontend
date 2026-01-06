import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Service } from '@/types';
import api from '@/services/api';

type CatalogoServicoDTO = {
  id: string;
  nome: string;
  descricao: string;
  nao_faturavel: boolean;
  valor: number;
};

const toFrontend = (dto: CatalogoServicoDTO): Service => ({
  id: dto.id,
  name: dto.nome,
  description: dto.descricao,
  price: dto.valor,
  nao_faturavel: dto.nao_faturavel,
});

const toBackend = (svc: Partial<Service>) => ({
  nome: svc.name ?? '',
  descricao: svc.description ?? '',
  nao_faturavel: svc.nao_faturavel ?? false,
  valor: svc.price ?? 0,
});

export const useServicesCatalog = () => {
  return useQuery<Service[]>({
    queryKey: ['servicesCatalog'],
    queryFn: async () => {
      const { data } = await api.get<CatalogoServicoDTO[]>('/api/catalogo-servicos/');
      return data.map(toFrontend);
    },
  });
};

export const useServiceById = (id?: string) => {
  return useQuery<Service>({
    queryKey: ['serviceById', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<CatalogoServicoDTO>(`/api/catalogo-servicos/${id}/`);
      return toFrontend(data);
    },
  });
};

export const useUpsertService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Service> & { id?: string }) => {
      if (payload.id) {
        await api.put(`/api/catalogo-servicos/${payload.id}/`, toBackend(payload));
        return {
          id: payload.id,
          name: payload.name ?? '',
          description: payload.description ?? '',
          price: payload.price ?? 0,
          nao_faturavel: payload.nao_faturavel ?? false,
        } as Service;
      }
      const { data } = await api.post<CatalogoServicoDTO>('/api/catalogo-servicos/', toBackend(payload));
      return toFrontend(data);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['servicesCatalog'] });
    },
  });
};

export const useDeleteService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/catalogo-servicos/${id}/`);
      return id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['servicesCatalog'] });
    },
  });
};
