// Re-export da feature analytics para manter compatibilidade com imports existentes.
// Novos arquivos devem importar diretamente de @/features/analytics/services e @/features/analytics/hooks.
export type {
  DashboardServiceMonthlyItem,
  DashboardOrdersSummary,
  DashboardServiceTopItem,
  DashboardServiceStatusItem,
  DashboardServicesSummary,
  DashboardTaskStatusItem,
  DashboardTasksSummary,
  DashboardMinioSummary,
  DashboardClientItem,
  DashboardClientSalesItem,
  DashboardClientsSummary,
  DashboardAnalyticsResponse,
} from '@/features/analytics/services';
export { getDashboardAnalytics } from '@/features/analytics/services';
export { useDashboardAnalytics } from '@/features/analytics/hooks';

