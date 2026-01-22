import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { ServiceExecution, ServiceListItem } from '@/types';

export const useServiceList = () => {
  return useQuery<ServiceListItem[]>({
    queryKey: ['serviceList'],
    queryFn: async () => {
      const { data } = await api.get<any[]>('/api/servicos/');
      return (data ?? []).map((item) => {
        // Extração robusta de dados para cobrir variações na resposta da API
        const id = item.id;
        const status = item.status ?? 'nao_iniciado';
        const ordem_servico = item.ordem_servico;
        // Garante que tem_tarefas seja capturado se existir, verificando variações comuns
        // Converte explicitamente para booleano
        const rawTemTarefas = item.tem_tarefas ?? item.temTarefas ?? item.hasTasks ?? item.has_tasks;
        const tem_tarefas = Boolean(rawTemTarefas);
        
        // Debug para verificar o que está chegando (será removido em produção)
        // console.log(`Service ${id} tem_tarefas:`, tem_tarefas, 'raw:', rawTemTarefas);

        let cliente_nome = item.cliente_nome ?? '';
        let servico_catalogo_nome = item.servico_catalogo_nome ?? '';

        // Fallbacks para servico_catalogo_nome
        if (!servico_catalogo_nome) {
          if (item.repositorio?.nome) {
            servico_catalogo_nome = item.repositorio.nome;
          } else {
            const detailed = item as ServiceExecution;
            servico_catalogo_nome = detailed.nome_servico ?? detailed.catalogo_servico_details?.nome ?? String(detailed.catalogo_servico ?? '');
          }
        }

        // Fallbacks para cliente_nome
        if (!cliente_nome) {
          const detailed = item as ServiceExecution;
          cliente_nome = detailed.nome_cliente ?? detailed.ordem_servico_details?.cliente_details?.nome ?? '';
        }

        return {
          id,
          cliente_nome,
          servico_catalogo_nome,
          status,
          ordem_servico,
          tem_tarefas,
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
