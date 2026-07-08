import { useQuery } from '@tanstack/react-query';
import {
  getAnaliseOperacional,
  getDashboardAnalytics,
  getFinanceiroKpis,
  getProdutividade,
  type AnaliseOperacionalResponse,
  type DashboardAnalyticsResponse,
  type FinanceiroKpisResponse,
  type ProdutividadeResponse,
} from './services';

export const useDashboardAnalytics = () =>
  useQuery<DashboardAnalyticsResponse>({
    queryKey: ['analytics-dashboard'],
    queryFn: getDashboardAnalytics,
    staleTime: 1000 * 60 * 5,
  });

export const useFinanceiroKpis = () =>
  useQuery<FinanceiroKpisResponse>({
    queryKey: ['analytics-financeiro-kpis'],
    queryFn: getFinanceiroKpis,
    staleTime: 1000 * 60 * 5,
  });

export const useProdutividade = () =>
  useQuery<ProdutividadeResponse>({
    queryKey: ['analytics-produtividade'],
    queryFn: getProdutividade,
    staleTime: 1000 * 60 * 5,
  });

export const useAnaliseOperacional = () =>
  useQuery<AnaliseOperacionalResponse>({
    queryKey: ['analise-operacional'],
    queryFn: getAnaliseOperacional,
    staleTime: 1000 * 60 * 5,
  });
