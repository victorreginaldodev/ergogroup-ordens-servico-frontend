import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';

export interface Comentario {
  id: number;
  servico: number;
  texto: string;
  criado_em: string;
  criado_por: number;
  criado_por_nome: string;
  criado_por_foto?: string; // Optional, in case the API returns it or we need to fetch it
}

export interface CreateComentarioPayload {
  servico: number;
  texto: string;
}

const endpoint = '/api/comentarios/';

export const comentariosService = {
  list: async (servicoId?: number): Promise<Comentario[]> => {
    const url = servicoId ? `${endpoint}?servico=${servicoId}` : endpoint;
    const res = await api.get<Comentario[]>(url);
    return res.data;
  },
  create: async (payload: CreateComentarioPayload): Promise<Comentario> => {
    const res = await api.post<Comentario>(endpoint, payload);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`${endpoint}${id}/`);
  },
};

export const useComentarios = (servicoId?: number) => {
  return useQuery<Comentario[]>({
    queryKey: ['comentarios', servicoId],
    queryFn: () => comentariosService.list(servicoId),
    enabled: !!servicoId,
  });
};

export const useComentarioOperations = (servicoId?: number) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['comentarios'] });
    if (servicoId) {
      queryClient.invalidateQueries({ queryKey: ['comentarios', servicoId] });
    }
  };

  const createComentario = useMutation({
    mutationFn: comentariosService.create,
    onSuccess: invalidate,
  });

  const deleteComentario = useMutation({
    mutationFn: comentariosService.delete,
    onSuccess: invalidate,
  });

  return {
    createComentario,
    deleteComentario,
  };
};
