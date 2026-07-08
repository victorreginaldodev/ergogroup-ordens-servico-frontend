import { authService } from '@/services/auth';

const TECHNICIAN_ROLES = new Set(['tecnico', 'sub_gestor_tecnico']);

// Roles que não podem visualizar valores monetários (R$)
const NO_VALUE_ROLES = new Set(['tecnico', 'sub_gestor_tecnico', 'gestor_administrativo', 'administrativo']);

// Setor técnico: quem executa e quem gerencia a execução (não inclui comercial/financeiro/administrativo)
const TECHNICAL_SECTOR_ROLES = new Set(['tecnico', 'sub_gestor_tecnico', 'gestor_tecnico']);

const FINANCE_ROLES = new Set(['financeiro', 'gestor_financeiro']);

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
  const isLeadTechnician = role === 'gestor_tecnico';
  const isAdministrative = role === 'administrativo';
  const isAdministrativeSector = role === 'administrativo' || role === 'gestor_administrativo';
  const isFinance = FINANCE_ROLES.has(role);
  const isRestricted = TECHNICIAN_ROLES.has(role);

  // Setor técnico (execução + gestão da execução) — usado para decidir zonas/colunas
  // que fazem sentido para quem trabalha com Serviço/Tarefa, independente de nível de gestão
  const isTechnicalSector = TECHNICAL_SECTOR_ROLES.has(role);

  // Diretor e Gestor Comercial têm acesso total
  const canAccessFinancials = !isRestricted;
  const canManageOrders = !isRestricted;
  const canViewOrderValues = !NO_VALUE_ROLES.has(role);
  const canManageServices = !(isRestricted || isAdministrative);
  const canManageTasks = !isAdministrative;
  const canManageQuickTasks = !isAdministrative;

  return {
    role,
    isDirector,
    isTechnician,
    isSubLeadTechnician,
    isLeadTechnician,
    isAdministrative,
    isAdministrativeSector,
    isFinance,
    isRestricted,
    isTechnicalSector,
    canAccessFinancials,
    canManageOrders,
    canViewOrderValues,
    canManageServices,
    canManageTasks,
    canManageQuickTasks,
    canManageFinancials: canAccessFinancials,
  };
};
