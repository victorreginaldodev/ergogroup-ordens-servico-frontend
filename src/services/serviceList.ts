import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { ServiceExecution, ServiceListItem } from '@/types';

export const useServiceList = () => {
  return useQuery<ServiceListItem[]>({
    queryKey: ['serviceList'],
    queryFn: async () => {
      const { data } = await api.get<any[]>('/api/servicos/');
      return (data ?? []).map((item) => {
        if ('cliente_nome' in item && 'servico_catalogo_nome' in item) {
          return item as ServiceListItem;
        }
        if ('repositorio' in item || 'ordem_servico' in item) {
          return {
            id: item.id,
            cliente_nome: '',
            servico_catalogo_nome: item.repositorio?.nome ?? '',
            status: item.status ?? 'nao_iniciado',
            ordem_servico: item.ordem_servico,
          } as ServiceListItem;
        }
        const detailed = item as ServiceExecution;
        return {
          id: detailed.id,
          cliente_nome: detailed.nome_cliente ?? detailed.ordem_servico_details?.cliente_details?.nome ?? '',
          servico_catalogo_nome: detailed.nome_servico ?? detailed.catalogo_servico_details?.nome ?? String(detailed.catalogo_servico ?? ''),
          status: detailed.status ?? 'nao_iniciado',
        } as ServiceListItem;
      });
    },
  });
};

export const useServiceExecutionById = (id: string) => {
  return useQuery<ServiceExecution>({
    queryKey: ['serviceExecution', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ServiceExecution>(`/api/servicos/${id}/`);
      return data;
    },
  });
};
