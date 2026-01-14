import { authService } from '@/services/auth';

const TECHNICIAN_ROLES = new Set(['tecnico', 'sub_lider_tecnico']);

export const useUserRole = () => {
  const user = authService.getCurrentUser();
  let role = user?.tipo_usuario ?? '';

  // Normalizar role para garantir que Gestor Comercial seja tratado como diretor
  const normalizeRole = (r: string): string => {
    const normalized = r
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/-/g, ' ')
      .trim();
    if (normalized === 'gestor comercial') {
      return 'diretor';
    }
    return r;
  };

  role = normalizeRole(role);

  // Gestor Comercial tem o mesmo nível de acesso que diretor
  const isDirector = role === 'diretor';
  const isTechnician = role === 'tecnico';
  const isSubLeadTechnician = role === 'sub_lider_tecnico';
  const isAdministrative = role === 'administrativo';
  const isRestricted = TECHNICIAN_ROLES.has(role);

  // Diretor e Gestor Comercial têm acesso total
  const canAccessFinancials = !isRestricted;
  const canManageOrders = !isRestricted;
  const canViewOrderValues = !isRestricted;
  const canManageServices = !(isRestricted || isAdministrative);
  const canManageTasks = !isAdministrative;
  const canManageQuickTasks = !isAdministrative;

  return {
    role,
    isTechnician,
    isSubLeadTechnician,
    isAdministrative,
    isRestricted,
    canAccessFinancials,
    canManageOrders,
    canViewOrderValues,
    canManageServices,
    canManageTasks,
    canManageQuickTasks,
    canManageFinancials: canAccessFinancials,
  };
};
