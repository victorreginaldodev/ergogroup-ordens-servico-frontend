import { authService } from '@/services/auth';

export const useUserRole = () => {
  const user = authService.getCurrentUser();
  const role = user?.tipo_usuario || '';
  
  const isRestricted = role === 'operacional' || role === 'sub_admin_tecnico';
  const canManageFinancials = !isRestricted;
  
  return {
    role,
    isRestricted,
    canManageFinancials
  };
};
