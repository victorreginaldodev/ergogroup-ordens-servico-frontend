import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageResult } from '@/services/pagination';
import {
  BillingServiceOrder,
  BillingOrdersPageParams,
  BillingKpis,
  MiniOsItem,
  MiniOsDetail,
  MiniOsPageParams,
  MiniOsUpdatePayload,
  getBillingServiceOrdersPage,
  getBillingKpis,
  getMiniOsPage,
  getMiniOsDetail,
  updateMiniOs,
} from './services';

export const useBillingKpis = () =>
  useQuery<BillingKpis>({
    queryKey: ['faturamento-kpis'],
    queryFn: getBillingKpis,
  });

export const useBillingServiceOrdersPage = (params: BillingOrdersPageParams) =>
  useQuery<PageResult<BillingServiceOrder>>({
    queryKey: ['faturamento-ordens-pagina', params],
    queryFn: () => getBillingServiceOrdersPage(params),
  });

export const useMiniOsPage = (params: MiniOsPageParams) =>
  useQuery<PageResult<MiniOsItem>>({
    queryKey: ['faturamento-mini-os-pagina', params],
    queryFn: () => getMiniOsPage(params),
  });

export const useMiniOsDetail = (id?: number | string) =>
  useQuery<MiniOsDetail>({
    queryKey: ['faturamento-mini-os-detalhe', id],
    enabled: !!id,
    queryFn: () => {
      if (!id) throw new Error('missing id');
      return getMiniOsDetail(id);
    },
  });

export const useUpdateMiniOs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: MiniOsUpdatePayload }) =>
      updateMiniOs(id, payload),
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['faturamento-mini-os-pagina'] }),
        qc.invalidateQueries({ queryKey: ['faturamento-mini-os-detalhe', id] }),
      ]);
    },
  });
};
