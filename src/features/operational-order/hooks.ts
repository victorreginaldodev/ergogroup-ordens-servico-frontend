import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getOperationalOrderList,
  getOperationalOrderPage,
  getOperationalOrderDetail,
  createOperationalOrder,
  updateOperationalOrder,
  deleteOperationalOrder,
  getOperationalOrderCatalog,
  getOperationalOrderCatalogPage,
  getOperationalOrderCatalogItem,
  createOperationalOrderCatalogItem,
  updateOperationalOrderCatalogItem,
  deleteOperationalOrderCatalogItem,
  CreateOperationalOrderPayload,
  UpdateOperationalOrderPayload,
  OperationalOrderListParams,
  OperationalOrderCatalogPageParams,
} from './services';

// ── Helpers ───────────────────────────────────────────────────────────────────

const invalidateList = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['operational-order-list'] });
  qc.invalidateQueries({ queryKey: ['operational-order-page'] });
};

const invalidateCatalog = (qc: ReturnType<typeof useQueryClient>, id?: number) => {
  qc.invalidateQueries({ queryKey: ['operational-order-catalog'] });
  qc.invalidateQueries({ queryKey: ['operational-order-catalog-page'] });
  if (id !== undefined) qc.invalidateQueries({ queryKey: ['operational-order-catalog-item', id] });
};

// ── Operational Order queries ─────────────────────────────────────────────────

export const useOperationalOrderList = () =>
  useQuery({
    queryKey: ['operational-order-list'],
    queryFn: getOperationalOrderList,
    staleTime: 1000 * 60 * 2,
  });

export const useOperationalOrderPage = (params: OperationalOrderListParams) =>
  useQuery({
    queryKey: ['operational-order-page', params],
    queryFn: () => getOperationalOrderPage(params),
    staleTime: 1000 * 60 * 2,
  });

export const useOperationalOrderDetail = (id?: number) =>
  useQuery({
    queryKey: ['operational-order-detail', id],
    queryFn: () => getOperationalOrderDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });

// ── Operational Order mutations ───────────────────────────────────────────────

export const useCreateOperationalOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOperationalOrderPayload) => createOperationalOrder(payload),
    onSuccess: () => invalidateList(qc),
  });
};

export const useUpdateOperationalOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateOperationalOrderPayload }) =>
      updateOperationalOrder(id, payload),
    onSuccess: (_, { id }) => {
      invalidateList(qc);
      qc.invalidateQueries({ queryKey: ['operational-order-detail', id] });
    },
  });
};

export const useDeleteOperationalOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteOperationalOrder(id),
    onSuccess: () => invalidateList(qc),
  });
};

// ── Catalog queries ───────────────────────────────────────────────────────────

export const useOperationalOrderCatalog = () =>
  useQuery({
    queryKey: ['operational-order-catalog'],
    queryFn: getOperationalOrderCatalog,
    staleTime: 1000 * 60 * 5,
  });

export const useOperationalOrderCatalogPage = (params: OperationalOrderCatalogPageParams) =>
  useQuery({
    queryKey: ['operational-order-catalog-page', params],
    queryFn: () => getOperationalOrderCatalogPage(params),
    staleTime: 1000 * 60 * 5,
  });

export const useOperationalOrderCatalogItem = (id?: number) =>
  useQuery({
    queryKey: ['operational-order-catalog-item', id],
    queryFn: () => getOperationalOrderCatalogItem(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

// ── Catalog mutations ─────────────────────────────────────────────────────────

export const useUpsertOperationalOrderCatalog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id?: number;
      payload: { nome: string; descricao?: string | null };
    }) => {
      if (id === undefined) return createOperationalOrderCatalogItem(payload);
      return updateOperationalOrderCatalogItem(id, payload);
    },
    onSuccess: (_, { id }) => invalidateCatalog(qc, id),
  });
};

export const useDeleteOperationalOrderCatalog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteOperationalOrderCatalogItem(id),
    onSuccess: (_, id) => invalidateCatalog(qc, id),
  });
};
