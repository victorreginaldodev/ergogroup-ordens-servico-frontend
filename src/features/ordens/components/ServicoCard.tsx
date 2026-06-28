import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserRole } from '@/hooks/useUserRole';
import { useUsers } from '@/services/users';
import {
  useCreateTarefa,
  useDeleteTarefa,
  useUpdateTarefa,
  useTarefasDeServico,
} from '../hooks';
import { TarefaRow } from './TarefaRow';
import { formatDate } from '../utils';
import type { ServicoDetalhe, UpdateTarefaPayload } from '../services';

const STATUS_DOT: Record<string, string> = {
  aberto:       'bg-blue-500',
  em_andamento: 'bg-yellow-500',
  concluida:    'bg-green-500',
  cancelado:    'bg-gray-400',
};

interface ServicoCardProps {
  servico: ServicoDetalhe;
  ordemId: number;
}

export function ServicoCard({ servico, ordemId }: ServicoCardProps) {
  const [showNovaTarefa, setShowNovaTarefa] = useState(false);
  const [novaDescricao, setNovaDescricao]   = useState('');
  const [novaResponsavel, setNovaResponsavel] = useState('');

  const { canManageTasks } = useUserRole();
  const ctx = { servicoId: servico.id, ordemId };

  const { data: tarefas, isLoading } = useTarefasDeServico(servico.id);
  const { data: usuarios = [] }      = useUsers();

  const createMutation = useCreateTarefa(ctx);
  const updateMutation = useUpdateTarefa(ctx);
  const deleteMutation = useDeleteTarefa(ctx);

  const nome       = servico.repositorio_detail?.nome ?? servico.repositorio_nome ?? `Serviço #${servico.id}`;
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleCriarTarefa = () => {
    if (!novaDescricao.trim() || !novaResponsavel) return;
    createMutation.mutate(
      { servico: servico.id, descricao: novaDescricao.trim(), responsavel: Number(novaResponsavel) },
      {
        onSuccess: () => {
          setNovaDescricao('');
          setNovaResponsavel('');
          setShowNovaTarefa(false);
        },
      },
    );
  };

  return (
    <div>
      {/* ── Linha do serviço ── */}
      <div className="flex items-center gap-3 bg-muted/30 px-4 py-3">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT[servico.status] ?? 'bg-gray-400')} />

        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold">{nome}</span>
          {servico.descricao && (
            <span className="ml-2 truncate text-xs text-muted-foreground">{servico.descricao}</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
          {(servico.data_inicio || servico.data_termino) && (
            <span>
              {formatDate(servico.data_inicio) ?? '—'}
              {' → '}
              {formatDate(servico.data_termino) ?? '—'}
            </span>
          )}
          {servico.terminado_por_nome && (
            <span className="hidden sm:inline">{servico.terminado_por_nome}</span>
          )}
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
              servico.status === 'concluida'    && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              servico.status === 'em_andamento' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
              servico.status === 'aberto'       && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              servico.status === 'cancelado'    && 'bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400',
            )}
          >
            {servico.status_display}
          </span>
        </div>
      </div>

      {/* ── Tarefas (indentadas) ── */}
      <div className="ml-4 border-l-2 border-border/50">
        {isLoading ? (
          <div className="space-y-1.5 px-4 py-2">
            <Skeleton className="h-7 w-full rounded" />
            <Skeleton className="h-7 w-3/4 rounded" />
          </div>
        ) : (
          <>
            {tarefas?.length ? (
              <div className="divide-y divide-border/40">
                {tarefas.map((t) => (
                  <TarefaRow
                    key={t.id}
                    tarefa={t}
                    usuarios={usuarios}
                    onStatusChange={(id, status) => updateMutation.mutate({ id, payload: { status } })}
                    onEdit={(id, payload: UpdateTarefaPayload) => updateMutation.mutate({ id, payload })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    isPending={isMutating}
                    canManage={canManageTasks}
                  />
                ))}
              </div>
            ) : (
              !showNovaTarefa && (
                <p className="px-4 py-2 text-xs text-muted-foreground">Nenhuma tarefa.</p>
              )
            )}

            {canManageTasks && (
              <div className="px-3 pb-2">
                {showNovaTarefa ? (
                  <div className="mt-2 space-y-3 rounded-lg bg-muted/40 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Responsável</p>
                        <Select value={novaResponsavel} onValueChange={setNovaResponsavel}>
                          <SelectTrigger className="h-8 border-border bg-background text-sm">
                            <SelectValue placeholder="Selecionar executor" />
                          </SelectTrigger>
                          <SelectContent>
                            {usuarios.map((u) => (
                              <SelectItem key={u.id} value={String(u.id)}>
                                {u.nome_completo || u.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-xs text-muted-foreground">Descrição</p>
                        <Textarea
                          value={novaDescricao}
                          onChange={(e) => setNovaDescricao(e.target.value)}
                          placeholder="Descreva a tarefa..."
                          className="min-h-16 resize-none border-border bg-background text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => { setShowNovaTarefa(false); setNovaDescricao(''); setNovaResponsavel(''); }}
                        disabled={createMutation.isPending}
                      >
                        <X className="mr-1 h-3.5 w-3.5" /> Cancelar
                      </Button>
                      <Button
                        variant="hero" size="sm"
                        onClick={handleCriarTarefa}
                        disabled={!novaDescricao.trim() || !novaResponsavel || createMutation.isPending}
                      >
                        {createMutation.isPending
                          ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          : <Plus className="mr-1 h-3.5 w-3.5" />}
                        Adicionar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button" variant="ghost" size="sm"
                    className="mt-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNovaTarefa(true)}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Nova tarefa
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
