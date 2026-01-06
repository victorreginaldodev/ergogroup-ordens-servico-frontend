import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Checklist, ChecklistItem, ServiceComment, ServiceItemManagement, ServiceCollaborator } from '@/types';

const MGMT_KEY = 'servix_service_management';

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const read = <T,>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

type Store = Record<string, ServiceItemManagement>;

const getStore = (): Store => read<Store>(MGMT_KEY, {});
const setStore = (store: Store) => write(MGMT_KEY, store);

const keyFor = (orderId: string, itemId: string) => `${orderId}:${itemId}`;

export const getManagement = (orderId: string, itemId: string): ServiceItemManagement => {
  const store = getStore();
  const key = keyFor(orderId, itemId);
  if (!store[key]) {
    store[key] = {
      orderId,
      itemId,
      collaborators: [],
      comments: [],
      checklists: [],
    };
    setStore(store);
  }
  return store[key];
};

export const setManagement = (orderId: string, itemId: string, data: ServiceItemManagement) => {
  const store = getStore();
  store[keyFor(orderId, itemId)] = data;
  setStore(store);
};

export const useServiceItemManagement = (orderId: string, itemId: string) => {
  return useQuery<ServiceItemManagement>({
    queryKey: ['serviceItemManagement', orderId, itemId],
    queryFn: async () => getManagement(orderId, itemId),
  });
};

export const useAssignCollaborator = (orderId: string, itemId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { userId: string; note?: string }) => {
      const current = getManagement(orderId, itemId);
      const exists = current.collaborators.some(c => c.userId === payload.userId);
      if (exists) return current;
      const collaborator: ServiceCollaborator = {
        userId: payload.userId,
        status: 'pending',
        note: payload.note,
      };
      const next: ServiceItemManagement = { ...current, collaborators: [...current.collaborators, collaborator] };
      setManagement(orderId, itemId, next);
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceItemManagement', orderId, itemId] });
    },
  });
};

export const useRemoveCollaborator = (orderId: string, itemId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { userId: string }) => {
      const current = getManagement(orderId, itemId);
      const next: ServiceItemManagement = { 
        ...current, 
        collaborators: current.collaborators.filter(c => c.userId !== payload.userId) 
      };
      setManagement(orderId, itemId, next);
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceItemManagement', orderId, itemId] });
    },
  });
};

export const useSetCollaboratorStatus = (orderId: string, itemId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { userId: string; status: 'pending' | 'in_progress' | 'done' }) => {
      const current = getManagement(orderId, itemId);
      const updated = current.collaborators.map(c => {
        if (c.userId !== payload.userId) return c;
        const now = new Date().toISOString();
        if (payload.status === 'in_progress') {
          return { ...c, status: payload.status, startedAt: c.startedAt || now };
        }
        if (payload.status === 'done') {
          return { ...c, status: payload.status, completedAt: now };
        }
        return { ...c, status: payload.status };
      });
      const next: ServiceItemManagement = { ...current, collaborators: updated };
      setManagement(orderId, itemId, next);
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceItemManagement', orderId, itemId] });
    },
  });
};

export const useAddComment = (orderId: string, itemId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { authorId: string; body: string }) => {
      const current = getManagement(orderId, itemId);
      const comment: ServiceComment = {
        id: uid(),
        authorId: payload.authorId,
        body: payload.body,
        createdAt: new Date().toISOString(),
      };
      const next: ServiceItemManagement = { ...current, comments: [comment, ...current.comments] };
      setManagement(orderId, itemId, next);
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceItemManagement', orderId, itemId] });
    },
  });
};

export const useDeleteComment = (orderId: string, itemId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { commentId: string }) => {
      const current = getManagement(orderId, itemId);
      const next: ServiceItemManagement = {
        ...current,
        comments: current.comments.filter(c => c.id !== payload.commentId),
      };
      setManagement(orderId, itemId, next);
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceItemManagement', orderId, itemId] });
    },
  });
};

export const useCreateChecklist = (orderId: string, itemId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; authorId?: string }) => {
      const current = getManagement(orderId, itemId);
      const checklist: Checklist = {
        id: uid(),
        title: payload.title,
        items: [],
        createdAt: new Date().toISOString(),
        createdBy: payload.authorId,
      };
      const next: ServiceItemManagement = { ...current, checklists: [checklist, ...current.checklists] };
      setManagement(orderId, itemId, next);
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceItemManagement', orderId, itemId] });
    },
  });
};

export const useAddChecklistItem = (orderId: string, itemId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { checklistId: string; text: string }) => {
      const current = getManagement(orderId, itemId);
      const nextChecklists = current.checklists.map(cl => {
        if (cl.id !== payload.checklistId) return cl;
        const item: ChecklistItem = { id: uid(), text: payload.text, done: false };
        return { ...cl, items: [...cl.items, item] };
      });
      const next: ServiceItemManagement = { ...current, checklists: nextChecklists };
      setManagement(orderId, itemId, next);
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceItemManagement', orderId, itemId] });
    },
  });
};

export const useToggleChecklistItem = (orderId: string, itemId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { checklistId: string; itemId: string; done: boolean }) => {
      const current = getManagement(orderId, itemId);
      const nextChecklists = current.checklists.map(cl => {
        if (cl.id !== payload.checklistId) return cl;
        const nextItems = cl.items.map(it => {
          if (it.id !== payload.itemId) return it;
          const now = new Date().toISOString();
          return { ...it, done: payload.done, doneAt: payload.done ? now : undefined };
        });
        return { ...cl, items: nextItems };
      });
      const next: ServiceItemManagement = { ...current, checklists: nextChecklists };
      setManagement(orderId, itemId, next);
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceItemManagement', orderId, itemId] });
    },
  });
};

export const useAssignChecklistItem = (orderId: string, itemId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { checklistId: string; itemId: string; userId?: string }) => {
      const current = getManagement(orderId, itemId);
      const nextChecklists = current.checklists.map(cl => {
        if (cl.id !== payload.checklistId) return cl;
        const nextItems = cl.items.map(it => {
          if (it.id !== payload.itemId) return it;
          return { ...it, assignedTo: payload.userId };
        });
        return { ...cl, items: nextItems };
      });
      const next: ServiceItemManagement = { ...current, checklists: nextChecklists };
      setManagement(orderId, itemId, next);
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceItemManagement', orderId, itemId] });
    },
  });
};

export const useDeleteChecklist = (orderId: string, itemId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { checklistId: string }) => {
      const current = getManagement(orderId, itemId);
      const next: ServiceItemManagement = {
        ...current,
        checklists: current.checklists.filter(cl => cl.id !== payload.checklistId),
      };
      setManagement(orderId, itemId, next);
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceItemManagement', orderId, itemId] });
    },
  });
};

export const useDeleteChecklistItem = (orderId: string, itemId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { checklistId: string; itemId: string }) => {
      const current = getManagement(orderId, itemId);
      const nextChecklists = current.checklists.map(cl => {
        if (cl.id !== payload.checklistId) return cl;
        return { ...cl, items: cl.items.filter(it => it.id !== payload.itemId) };
      });
      const next: ServiceItemManagement = { ...current, checklists: nextChecklists };
      setManagement(orderId, itemId, next);
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceItemManagement', orderId, itemId] });
    },
  });
};

export const useUpdateChecklistTitle = (orderId: string, itemId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { checklistId: string; title: string }) => {
      const current = getManagement(orderId, itemId);
      const nextChecklists = current.checklists.map(cl => {
        if (cl.id !== payload.checklistId) return cl;
        return { ...cl, title: payload.title };
      });
      const next: ServiceItemManagement = { ...current, checklists: nextChecklists };
      setManagement(orderId, itemId, next);
      return next;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['serviceItemManagement', orderId, itemId] });
    },
  });
};
