import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CatalogoItem,
  CatalogoOperacionalItem,
  CatalogoOperacionalPayload,
  CatalogoPayload,
  RepositoryItem,
  SubitemCatalogoItem,
  SubitemCatalogoPayload,
  createCatalogo,
  createCatalogoOperacional,
  createSubitemCatalogo,
  deleteCatalogo,
  deleteCatalogoOperacional,
  deleteSubitemCatalogo,
  getCatalogo,
  getCatalogoOperacional,
  getCatalogos,
  getCatalogosOperacionais,
  getRepositories,
  getSubitensCatalogo,
  updateCatalogo,
  updateCatalogoOperacional,
  updateSubitemCatalogo,
} from './services';

// ── Catálogo ──────────────────────────────────────────────────────────────────

export const useCatalogos = (params: { q?: string } = {}) =>
  useQuery<CatalogoItem[]>({
    queryKey: ['catalogos', params],
    queryFn: () => getCatalogos(params),
  });

export const useCatalogo = (id?: number) =>
  useQuery<CatalogoItem>({
    queryKey: ['catalogo', id],
    enabled: id !== undefined,
    queryFn: () => getCatalogo(id as number),
  });

export const useUpsertCatalogo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: Partial<CatalogoPayload> }) =>
      id === undefined ? createCatalogo(payload as CatalogoPayload) : updateCatalogo(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['catalogos'] });
      if (id !== undefined) qc.invalidateQueries({ queryKey: ['catalogo', id] });
    },
  });
};

export const useDeleteCatalogo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCatalogo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogos'] }),
  });
};

// ── Subitem de Catálogo ───────────────────────────────────────────────────────

export const useSubitensCatalogo = (catalogo?: number) =>
  useQuery<SubitemCatalogoItem[]>({
    queryKey: ['subitens-catalogo', catalogo],
    enabled: catalogo !== undefined,
    queryFn: () => getSubitensCatalogo({ catalogo }),
  });

export const useUpsertSubitemCatalogo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: Partial<SubitemCatalogoPayload> }) =>
      id === undefined
        ? createSubitemCatalogo(payload as SubitemCatalogoPayload)
        : updateSubitemCatalogo(id, payload),
    onSuccess: (_, { payload }) => {
      qc.invalidateQueries({ queryKey: ['subitens-catalogo', payload.catalogo] });
      if (payload.catalogo !== undefined) qc.invalidateQueries({ queryKey: ['catalogo', payload.catalogo] });
    },
  });
};

export const useDeleteSubitemCatalogo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; catalogo: number }) => deleteSubitemCatalogo(id),
    onSuccess: (_, { catalogo }) => {
      qc.invalidateQueries({ queryKey: ['subitens-catalogo', catalogo] });
      qc.invalidateQueries({ queryKey: ['catalogo', catalogo] });
    },
  });
};

// ── Catálogo Operacional ──────────────────────────────────────────────────────

export const useCatalogosOperacionais = (params: { q?: string } = {}) =>
  useQuery<CatalogoOperacionalItem[]>({
    queryKey: ['catalogos-operacionais', params],
    queryFn: () => getCatalogosOperacionais(params),
    staleTime: 1000 * 60 * 5,
  });

export const useCatalogoOperacional = (id?: number) =>
  useQuery<CatalogoOperacionalItem>({
    queryKey: ['catalogo-operacional', id],
    enabled: id !== undefined,
    queryFn: () => getCatalogoOperacional(id as number),
  });

export const useUpsertCatalogoOperacional = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: Partial<CatalogoOperacionalPayload> }) =>
      id === undefined
        ? createCatalogoOperacional(payload as CatalogoOperacionalPayload)
        : updateCatalogoOperacional(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['catalogos-operacionais'] });
      if (id !== undefined) qc.invalidateQueries({ queryKey: ['catalogo-operacional', id] });
    },
  });
};

export const useDeleteCatalogoOperacional = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCatalogoOperacional(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalogos-operacionais'] }),
  });
};

// ── Compat: visão simplificada usada pelo módulo de Ordens de Serviço ─────────

export const useRepositories = () =>
  useQuery<RepositoryItem[]>({
    queryKey: ['catalogo-lista-simplificada'],
    queryFn: getRepositories,
  });
