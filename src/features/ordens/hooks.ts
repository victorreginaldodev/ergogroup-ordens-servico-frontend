import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTarefa,
  deleteTarefa,
  getAuditoriaTimeline,
  getOrdemDetalhe,
  getOrdensLista,
  getServicoDetalhe,
  getServicosDeOrdem,
  getTarefasDeServico,
  updateTarefa,
  type CreateTarefaPayload,
  type OrdemServicoDetalhe,
  type OrdemServicoItem,
  type RegistroAuditoria,
  type ServicoDetalhe,
  type TarefaDetalhe,
  type UpdateTarefaPayload,
} from './services';

export const useOrdensLista = () =>
  useQuery<OrdemServicoItem[]>({
    queryKey: ['ordens-lista'],
    queryFn: getOrdensLista,
    staleTime: 1000 * 60 * 2,
  });

export const useOrdemDetalhe = (id?: number) =>
  useQuery<OrdemServicoDetalhe>({
    queryKey: ['ordens-detalhe', id],
    queryFn: () => getOrdemDetalhe(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });

export const useServicosDeOrdem = (ordemId?: number) =>
  useQuery<ServicoDetalhe[]>({
    queryKey: ['ordens-servicos', ordemId],
    queryFn: () => getServicosDeOrdem(ordemId!),
    enabled: !!ordemId,
    staleTime: 1000 * 60 * 2,
  });

export const useServicoDetalhe = (id?: number) =>
  useQuery<ServicoDetalhe>({
    queryKey: ['servico-detalhe', id],
    queryFn: () => getServicoDetalhe(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });

export const useTarefasDeServico = (servicoId?: number) =>
  useQuery<TarefaDetalhe[]>({
    queryKey: ['ordens-tarefas-servico', servicoId],
    queryFn: () => getTarefasDeServico(servicoId!),
    enabled: !!servicoId,
    staleTime: 1000 * 60 * 2,
  });

export const useAuditoriaTimeline = (ordemId?: number) =>
  useQuery<RegistroAuditoria[]>({
    queryKey: ['auditoria-timeline', ordemId],
    queryFn: () => getAuditoriaTimeline(ordemId!),
    enabled: !!ordemId,
    staleTime: 1000 * 60 * 2,
  });

interface MutacaoContexto {
  servicoId: number;
  ordemId: number;
}

const invalidarContexto = (
  qc: ReturnType<typeof useQueryClient>,
  { servicoId, ordemId }: MutacaoContexto,
) => {
  qc.invalidateQueries({ queryKey: ['ordens-tarefas-servico', servicoId] });
  qc.invalidateQueries({ queryKey: ['ordens-servicos', ordemId] });
  qc.invalidateQueries({ queryKey: ['ordens-detalhe', ordemId] });
};

export const useCreateTarefa = (ctx: MutacaoContexto) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTarefaPayload) => createTarefa(payload),
    onSuccess: () => invalidarContexto(qc, ctx),
  });
};

export const useUpdateTarefa = (ctx: MutacaoContexto) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTarefaPayload }) =>
      updateTarefa(id, payload),
    onSuccess: () => invalidarContexto(qc, ctx),
  });
};

export const useDeleteTarefa = (ctx: MutacaoContexto) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTarefa(id),
    onSuccess: () => invalidarContexto(qc, ctx),
  });
};
