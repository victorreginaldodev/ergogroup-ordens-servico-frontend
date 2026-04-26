import { authService } from '@/services/auth';

const TECHNICIAN_ROLES = new Set(['tecnico', 'sub_gestor_tecnico']);

// Roles que não podem visualizar valores monetários (R$)
const NO_VALUE_ROLES = new Set(['tecnico', 'sub_gestor_tecnico', 'gestor_administrativo', 'administrativo']);

export const useUserRole = () => {
  const user = authService.getCurrentUser();
  let role = user?.tipo_usuario ?? '';

  // Normalizar role para garantir que Gestor Comercial seja tratado como diretor
  const normalizeRole = (r: string): string => {
    const normalized = r
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
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
  const isSubLeadTechnician = role === 'sub_gestor_tecnico';
  const isAdministrative = role === 'administrativo';
  const isRestricted = TECHNICIAN_ROLES.has(role);

  // Diretor e Gestor Comercial têm acesso total
  const canAccessFinancials = !isRestricted;
  const canManageOrders = !isRestricted;
  const canViewOrderValues = !NO_VALUE_ROLES.has(role);
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
