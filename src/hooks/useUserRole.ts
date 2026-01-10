import { authService } from '@/services/auth';

const TECHNICIAN_ROLES = new Set(['tecnico', 'sub_lider_tecnico']);

export const useUserRole = () => {
  const user = authService.getCurrentUser();
  const role = user?.tipo_usuario ?? '';

  const isTechnician = role === 'tecnico';
  const isSubLeadTechnician = role === 'sub_lider_tecnico';
  const isAdministrative = role === 'administrativo';
  const isRestricted = TECHNICIAN_ROLES.has(role);

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
