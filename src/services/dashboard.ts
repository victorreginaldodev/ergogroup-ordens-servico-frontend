import { useQuery } from '@tanstack/react-query';
import api from './api';

const endpoint = '/api/analise-dados/';

export interface DashboardOrdersSummary {
  total?: number;
  total_concluidas?: number;
  total_nao_concluidas?: number;
  recentes?: Array<{
    id?: number | string;
    numero?: string;
    cliente_id?: number;
    cliente_nome?: string;
    valor_total?: number;
    valor_total_formatado?: string;
    status?: string;
    status_display?: string;
    atualizado_em?: string;
  }>;
}

export interface DashboardServiceTopItem {
  repositorio_id: number;
  repositorio_nome: string;
  total: number;
}

export interface DashboardServiceStatusItem {
  status: string;
  status_display?: string;
  total: number;
}

export interface DashboardServiceMonthlyItem {
  mes?: string | number;
  month?: string | number;
  periodo?: string;
  ano?: number;
  total: number;
}

export interface DashboardServicesSummary {
  concluidos_ultimos_12_meses?: number;
  concluidos_ultimos_12_meses_total?: number;
  principais_por_quantidade?: DashboardServiceTopItem[];
  por_status?: DashboardServiceStatusItem[];
  concluidos_por_mes?: DashboardServiceMonthlyItem[];
}

export interface DashboardTaskStatusItem {
  status: string;
  status_display?: string;
  total: number;
}

export interface DashboardTasksSummary {
  concluidas_por_mes?: DashboardServiceMonthlyItem[];
  concluidas_ultimos_12_meses_total?: number;
  por_status?: DashboardTaskStatusItem[];
}

export interface DashboardMinioSummary {
  concluidas_ultimos_12_meses_total?: number;
  concluidas_por_mes?: DashboardServiceMonthlyItem[];
}

export interface DashboardClientItem {
  cliente_id: number;
  cliente_nome: string;
  total_valor_faturado: number;
}

export interface DashboardClientsSummary {
  mais_faturamento?: DashboardClientItem[];
}

export interface DashboardAnalyticsResponse {
  ordens_servico?: DashboardOrdersSummary;
  servicos?: DashboardServicesSummary;
  tarefas?: DashboardTasksSummary;
  minios?: DashboardMinioSummary;
  clientes?: DashboardClientsSummary;
}

export const getDashboardAnalytics = async (): Promise<DashboardAnalyticsResponse> => {
  const { data } = await api.get<DashboardAnalyticsResponse>(endpoint);
  return data ?? {};
};

export const useDashboardAnalytics = () => {
  return useQuery<DashboardAnalyticsResponse>({
    queryKey: ['dashboard-analytics'],
    queryFn: getDashboardAnalytics,
    staleTime: 1000 * 60 * 5,
  });
};

