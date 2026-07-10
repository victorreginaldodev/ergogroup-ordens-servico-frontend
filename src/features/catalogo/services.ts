import api from '@/services/api';

export type Complexidade = 1 | 2 | 3;

export const COMPLEXIDADE_LABEL: Record<Complexidade, string> = {
  1: 'Baixa',
  2: 'Média',
  3: 'Alta',
};

export const COMPLEXIDADE_DOT: Record<Complexidade, string> = {
  1: 'bg-muted-foreground',
  2: 'bg-yellow-500',
  3: 'bg-red-600',
};

// ── Catálogo (serviços de Ordem de Serviço) ───────────────────────────────────

export interface CatalogoItem {
  id: number;
  nome: string;
  descricao: string | null;
  horasEstimadas: string | null;
  complexidade: Complexidade | null;
}

export interface CatalogoPayload {
  nome: string;
  descricao?: string | null;
  horasEstimadas?: string | null;
  complexidade?: Complexidade | null;
}

type CatalogoDTO = {
  id: number;
  nome: string;
  descricao: string | null;
  horas_estimadas: string | null;
  complexidade: Complexidade | null;
};

const CATALOGO_ENDPOINT = '/api/catalogo/catalogos/';

const catalogoToFrontend = (dto: CatalogoDTO): CatalogoItem => ({
  id: dto.id,
  nome: dto.nome,
  descricao: dto.descricao ?? null,
  horasEstimadas: dto.horas_estimadas ?? null,
  complexidade: dto.complexidade ?? null,
});

const catalogoToBackend = (payload: Partial<CatalogoPayload>) => ({
  ...(payload.nome !== undefined ? { nome: payload.nome } : {}),
  ...(payload.descricao !== undefined ? { descricao: payload.descricao } : {}),
  ...(payload.horasEstimadas !== undefined ? { horas_estimadas: payload.horasEstimadas } : {}),
  ...(payload.complexidade !== undefined ? { complexidade: payload.complexidade } : {}),
});

export const getCatalogos = async (params: { q?: string } = {}): Promise<CatalogoItem[]> => {
  const queryParams: Record<string, string> = {};
  if (params.q) queryParams.q = params.q;
  const { data } = await api.get<CatalogoDTO[]>(CATALOGO_ENDPOINT, { params: queryParams });
  return (data || []).map(catalogoToFrontend);
};

export const getCatalogo = async (id: number): Promise<CatalogoItem> => {
  const { data } = await api.get<CatalogoDTO>(`${CATALOGO_ENDPOINT}${id}/`);
  return catalogoToFrontend(data);
};

export const createCatalogo = async (payload: CatalogoPayload): Promise<CatalogoItem> => {
  const { data } = await api.post<CatalogoDTO>(CATALOGO_ENDPOINT, catalogoToBackend(payload));
  return catalogoToFrontend(data);
};

export const updateCatalogo = async (id: number, payload: Partial<CatalogoPayload>): Promise<CatalogoItem> => {
  const { data } = await api.patch<CatalogoDTO>(`${CATALOGO_ENDPOINT}${id}/`, catalogoToBackend(payload));
  return catalogoToFrontend(data);
};

export const deleteCatalogo = async (id: number): Promise<void> => {
  await api.delete(`${CATALOGO_ENDPOINT}${id}/`);
};

// ── Catálogo Operacional (serviços de OS Operacional) ─────────────────────────

export interface CatalogoOperacionalItem {
  id: number;
  nome: string;
  descricao: string | null;
  horasEstimadas: string | null;
  complexidade: Complexidade | null;
}

export interface CatalogoOperacionalPayload {
  nome: string;
  descricao?: string | null;
  horasEstimadas?: string | null;
  complexidade?: Complexidade | null;
}

type CatalogoOperacionalDTO = {
  id: number;
  nome: string;
  descricao: string | null;
  horas_estimadas: string | null;
  complexidade: Complexidade | null;
};

const CATALOGO_OPERACIONAL_ENDPOINT = '/api/catalogo/catalogos-operacionais/';

const catalogoOperacionalToFrontend = (dto: CatalogoOperacionalDTO): CatalogoOperacionalItem => ({
  id: dto.id,
  nome: dto.nome,
  descricao: dto.descricao ?? null,
  horasEstimadas: dto.horas_estimadas ?? null,
  complexidade: dto.complexidade ?? null,
});

const catalogoOperacionalToBackend = (payload: Partial<CatalogoOperacionalPayload>) => ({
  ...(payload.nome !== undefined ? { nome: payload.nome } : {}),
  ...(payload.descricao !== undefined ? { descricao: payload.descricao } : {}),
  ...(payload.horasEstimadas !== undefined ? { horas_estimadas: payload.horasEstimadas } : {}),
  ...(payload.complexidade !== undefined ? { complexidade: payload.complexidade } : {}),
});

export const getCatalogosOperacionais = async (params: { q?: string } = {}): Promise<CatalogoOperacionalItem[]> => {
  const queryParams: Record<string, string> = {};
  if (params.q) queryParams.q = params.q;
  const { data } = await api.get<CatalogoOperacionalDTO[]>(CATALOGO_OPERACIONAL_ENDPOINT, { params: queryParams });
  return (data || []).map(catalogoOperacionalToFrontend);
};

export const getCatalogoOperacional = async (id: number): Promise<CatalogoOperacionalItem> => {
  const { data } = await api.get<CatalogoOperacionalDTO>(`${CATALOGO_OPERACIONAL_ENDPOINT}${id}/`);
  return catalogoOperacionalToFrontend(data);
};

export const createCatalogoOperacional = async (
  payload: CatalogoOperacionalPayload,
): Promise<CatalogoOperacionalItem> => {
  const { data } = await api.post<CatalogoOperacionalDTO>(
    CATALOGO_OPERACIONAL_ENDPOINT,
    catalogoOperacionalToBackend(payload),
  );
  return catalogoOperacionalToFrontend(data);
};

export const updateCatalogoOperacional = async (
  id: number,
  payload: Partial<CatalogoOperacionalPayload>,
): Promise<CatalogoOperacionalItem> => {
  const { data } = await api.patch<CatalogoOperacionalDTO>(
    `${CATALOGO_OPERACIONAL_ENDPOINT}${id}/`,
    catalogoOperacionalToBackend(payload),
  );
  return catalogoOperacionalToFrontend(data);
};

export const deleteCatalogoOperacional = async (id: number): Promise<void> => {
  await api.delete(`${CATALOGO_OPERACIONAL_ENDPOINT}${id}/`);
};

// ── Compat: visão simplificada usada pelo módulo de Ordens de Serviço ─────────

export interface RepositoryItem {
  id: string;
  name: string;
  description: string;
}

export const getRepositories = async (): Promise<RepositoryItem[]> => {
  const items = await getCatalogos({});
  return items.map((c) => ({ id: String(c.id), name: c.nome, description: c.descricao ?? '' }));
};
