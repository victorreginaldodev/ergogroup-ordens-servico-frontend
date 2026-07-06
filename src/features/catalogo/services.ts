import api from '@/services/api';
import { isPaginatedResponse, PageResult, toPageResult } from '@/services/pagination';

export interface RepositoryItem {
  id: string;
  name: string;
  description: string;
}

type RepositorioDTO = {
  id: number | string;
  nome: string;
  descricao: string;
};

const endpoint = '/api/servicos/repositorios/';

const toFrontend = (dto: RepositorioDTO): RepositoryItem => ({
  id: String(dto.id),
  name: dto.nome,
  description: dto.descricao,
});

const toBackend = (item: Partial<RepositoryItem>) => ({
  nome: item.name ?? '',
  descricao: item.description ?? '',
});

export const getRepositories = async (): Promise<RepositoryItem[]> => {
  const { data } = await api.get<RepositorioDTO[]>(endpoint);
  return (data || []).map(toFrontend);
};

export type RepositoriesPageParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export const getRepositoriesPage = async (params: RepositoriesPageParams): Promise<PageResult<RepositoryItem>> => {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const queryParams: Record<string, string | number> = {
    page,
    page_size: pageSize,
  };
  if (params.q) queryParams.q = params.q;

  const { data } = await api.get(endpoint, { params: queryParams });
  if (isPaginatedResponse<RepositorioDTO>(data)) {
    return {
      ...toPageResult(data, page, pageSize),
      items: data.results.map(toFrontend),
    };
  }

  const items = (Array.isArray(data) ? data : []).map(toFrontend);
  return {
    items,
    count: items.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    next: null,
    previous: null,
  };
};

export const getRepository = async (id: string): Promise<RepositoryItem> => {
  const { data } = await api.get<RepositorioDTO>(`${endpoint}${id}/`);
  return toFrontend(data);
};

export const upsertRepository = async (payload: Partial<RepositoryItem> & { id?: string }): Promise<RepositoryItem> => {
  if (payload.id) {
    const { id, ...body } = payload;
    const { data } = await api.put<RepositorioDTO>(`${endpoint}${id}/`, toBackend(body));
    return toFrontend(data);
  }
  const { data } = await api.post<RepositorioDTO>(endpoint, toBackend(payload));
  return toFrontend(data);
};

export const deleteRepository = async (id: string): Promise<string> => {
  await api.delete(`${endpoint}${id}/`);
  return id;
};
