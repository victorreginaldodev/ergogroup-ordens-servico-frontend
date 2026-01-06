import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Company, User } from '@/types';

const USERS_KEY = 'servix_users';
const CURRENT_USER_KEY = 'servix_current_user';
const COMPANY_KEY = 'servix_company';

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

const seedData = () => {
  const existingUsers = read<User[]>(USERS_KEY, []);
  const existingCurrent = read<User | null>(CURRENT_USER_KEY, null);
  const existingCompany = read<Company | null>(COMPANY_KEY, null);

  if (existingUsers.length === 0) {
    const admin: User = { id: 'u1', name: 'Usuário Admin', email: 'admin@empresa.com', role: 'admin', active: true };
    const u2: User = { id: 'u2', name: 'Ana Souza', email: 'ana@empresa.com', role: 'user', active: true };
    const u3: User = { id: 'u3', name: 'Carlos Lima', email: 'carlos@empresa.com', role: 'user', active: true };
    write(USERS_KEY, [admin, u2, u3]);
  }
  if (!existingCurrent) {
    const current = read<User[]>(USERS_KEY, [])[0] || { id: 'u1', name: 'Usuário', email: 'usuario@example.com' };
    write(CURRENT_USER_KEY, current);
  }
  if (!existingCompany) {
    const company: Company = {
      id: 'c1',
      name: 'Minha Empresa',
      cnpj: '00.000.000/0000-00',
      email: 'contato@empresa.com',
      phone: '(11) 99999-0000',
      address: 'Rua Exemplo, 123 - São Paulo/SP',
      logo: '',
    };
    write(COMPANY_KEY, company);
  }
};

seedData();

export const getUsers = (): User[] => read<User[]>(USERS_KEY, []);
export const setUsers = (users: User[]) => write(USERS_KEY, users);
export const getCurrentUser = (): User => read<User>(CURRENT_USER_KEY, getUsers()[0]);
export const setCurrentUser = (user: User) => write(CURRENT_USER_KEY, user);
export const getCompany = (): Company => read<Company>(COMPANY_KEY, { id: 'c1', name: '' });
export const setCompany = (company: Company) => write(COMPANY_KEY, company);

export const useUsers = () => {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => getUsers(),
  });
};

export const useCurrentUser = () => {
  return useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: async () => getCurrentUser(),
  });
};

export const useCompany = () => {
  return useQuery<Company>({
    queryKey: ['company'],
    queryFn: async () => getCompany(),
  });
};

export const useUpsertUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<User> & { id?: string }) => {
      const list = getUsers();
      if (payload.id) {
        const idx = list.findIndex(u => u.id === payload.id);
        if (idx >= 0) {
          const updated: User = { ...list[idx], ...payload };
          const next = [...list];
          next[idx] = updated;
          setUsers(next);
          const cur = getCurrentUser();
          if (cur.id === updated.id) setCurrentUser(updated);
          return updated;
        }
      }
      const created: User = {
        id: uid(),
        name: payload.name || '',
        email: payload.email || '',
        avatar: payload.avatar,
        role: payload.role || 'user',
        active: payload.active ?? true,
      };
      setUsers([created, ...list]);
      return created;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['users'] });
      await qc.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const list = getUsers().filter(u => u.id !== id);
      setUsers(list);
      const cur = getCurrentUser();
      if (cur.id === id && list.length > 0) setCurrentUser(list[0]);
      return id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['users'] });
      await qc.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

export const useUpdateCurrentUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<User>) => {
      const cur = getCurrentUser();
      const updated: User = { ...cur, ...payload };
      setCurrentUser(updated);
      const list = getUsers();
      const idx = list.findIndex(u => u.id === updated.id);
      if (idx >= 0) {
        const next = [...list];
        next[idx] = updated;
        setUsers(next);
      }
      return updated;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['currentUser'] });
      await qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpsertCompany = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Company>) => {
      const current = getCompany();
      const updated: Company = { ...current, ...payload };
      setCompany(updated);
      return updated;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['company'] });
    },
  });
};
