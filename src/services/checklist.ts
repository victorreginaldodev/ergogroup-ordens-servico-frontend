import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';

export interface ChecklistItem {
  id: number;
  checklist: number;
  descricao: string;
  concluido: boolean;
}

export interface Checklist {
  id: number;
  servico: number;
  observacao: string;
  criado_em: string;
  criado_por: number;
  criado_por_nome: string;
  itens: ChecklistItem[];
}

export interface CreateChecklistPayload {
  servico: number;
  observacao: string;
}

export interface UpdateChecklistPayload {
  observacao: string;
}

export interface CreateChecklistItemPayload {
  checklist: number;
  descricao: string;
  concluido?: boolean;
}

export interface UpdateChecklistItemPayload {
  descricao?: string;
  concluido?: boolean;
}

const checklistEndpoint = '/api/checklists/';
const itemEndpoint = '/api/itens-checklist/';

export const checklistService = {
  // Checklists
  list: async (servicoId?: number): Promise<Checklist[]> => {
    const url = servicoId ? `${checklistEndpoint}?servico=${servicoId}` : checklistEndpoint;
    const res = await api.get<Checklist[]>(url);
    return res.data;
  },
  get: async (id: number): Promise<Checklist> => {
    const res = await api.get<Checklist>(`${checklistEndpoint}${id}/`);
    return res.data;
  },
  create: async (payload: CreateChecklistPayload): Promise<Checklist> => {
    const res = await api.post<Checklist>(checklistEndpoint, payload);
    return res.data;
  },
  update: async (id: number, payload: UpdateChecklistPayload): Promise<Checklist> => {
    const res = await api.patch<Checklist>(`${checklistEndpoint}${id}/`, payload);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`${checklistEndpoint}${id}/`);
  },

  // Checklist Items
  createItem: async (payload: CreateChecklistItemPayload): Promise<ChecklistItem> => {
    const res = await api.post<ChecklistItem>(itemEndpoint, payload);
    return res.data;
  },
  updateItem: async (id: number, payload: UpdateChecklistItemPayload): Promise<ChecklistItem> => {
    const res = await api.patch<ChecklistItem>(`${itemEndpoint}${id}/`, payload);
    return res.data;
  },
  deleteItem: async (id: number): Promise<void> => {
    await api.delete(`${itemEndpoint}${id}/`);
  },
};

export const useChecklists = (servicoId?: number) => {
  return useQuery<Checklist[]>({
    queryKey: ['checklists', servicoId],
    queryFn: () => checklistService.list(servicoId),
  });
};

export const useChecklistOperations = (servicoId?: number) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['checklists'] });
    if (servicoId) {
      queryClient.invalidateQueries({ queryKey: ['checklists', servicoId] });
    }
  };

  const createChecklist = useMutation({
    mutationFn: checklistService.create,
    onSuccess: invalidate,
  });

  const updateChecklist = useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & UpdateChecklistPayload) =>
      checklistService.update(id, payload),
    onSuccess: invalidate,
  });

  const deleteChecklist = useMutation({
    mutationFn: checklistService.delete,
    onSuccess: invalidate,
  });

  const createItem = useMutation({
    mutationFn: checklistService.createItem,
    onSuccess: invalidate,
  });

  const updateItem = useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & UpdateChecklistItemPayload) =>
      checklistService.updateItem(id, payload),
    onSuccess: invalidate,
  });

  const deleteItem = useMutation({
    mutationFn: checklistService.deleteItem,
    onSuccess: invalidate,
  });

  return {
    createChecklist,
    updateChecklist,
    deleteChecklist,
    createItem,
    updateItem,
    deleteItem,
  };
};
