import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import { useUsers } from '@/features/usuarios/hooks';
import {
  useCreateTarefa,
  useDeleteTarefa,
  useUpdateTarefa,
  useTarefasDeServico,
} from '../hooks';
import { TarefaRow } from './TarefaRow';
import { formatDate } from '../utils';
import type { ServicoDetalhe, UpdateTarefaPayload } from '../services';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value ?? '—'}</p>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  aberto:       'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  em_andamento: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  concluida:    'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelado:    'bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400',
};

interface ServicoSheetProps {
  servico: ServicoDetalhe | null;
  ordemId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServicoSheet({ servico, ordemId, open, onOpenChange }: ServicoSheetProps) {
  const [showNovaTarefa, setShowNovaTarefa] = useState(false);
  const [novaDescricao, setNovaDescricao]     = useState('');
  const [novaResponsavel, setNovaResponsavel] = useState('');

  const { canManageTasks } = useUserRole();
  const ctx = { servicoId: servico?.id ?? 0, ordemId };

  const { data: tarefas, isLoading: loadingTarefas } = useTarefasDeServico(servico?.id);
  const { data: usuarios = [] } = useUsers();

  const createMutation = useCreateTarefa(ctx);
  const updateMutation = useUpdateTarefa(ctx);
  const deleteMutation = useDeleteTarefa(ctx);

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const nome = servico
    ? (servico.repositorio_detail?.nome ?? servico.repositorio_nome ?? `Serviço #${servico.id}`)
    : '';

  const handleCriarTarefa = () => {
    if (!novaDescricao.trim() || !novaResponsavel || !servico) return;
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-[520px]"
      >
        {servico && (
          <>
            {/* ── Cabeçalho ── */}
            <SheetHeader className="border-b border-border px-6 py-5">
              <div className="flex items-center justify-between gap-3 pr-8">
                <SheetTitle className="text-base leading-snug">{nome}</SheetTitle>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    STATUS_BADGE[servico.status] ?? 'bg-secondary text-secondary-foreground',
                  )}
                >
                  {servico.status_display}
                </span>
              </div>
              {servico.descricao && (
                <SheetDescription asChild>
                  <p className="mt-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm leading-relaxed text-foreground">
                    {servico.descricao}
                  </p>
                </SheetDescription>
              )}
            </SheetHeader>

            <ScrollArea className="flex-1">
              {/* ── Dados do serviço ── */}
              <div className="px-6 py-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Dados do serviço
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Início"        value={formatDate(servico.data_inicio)} />
                  <Field label="Término"       value={formatDate(servico.data_termino)} />
                  <Field label="Conclusão"     value={formatDate(servico.data_conclusao)} />
                  <Field label="Terminado por" value={servico.terminado_por_nome} />
                  <Field label="Criado em"     value={formatDate(servico.criado_em)} />
                  <Field label="Atualizado em" value={formatDate(servico.atualizado_em)} />
                </div>
              </div>

              <Separator />

              {/* ── Tarefas ── */}
              <div className="px-6 py-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tarefas
                    {tarefas?.length ? (
                      <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold normal-case text-foreground">
                        {tarefas.length}
                      </span>
                    ) : null}
                  </p>
                  {canManageTasks && !showNovaTarefa && (
                    <Button
                      type="button"
                      variant="hero"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowNovaTarefa(true)}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Nova tarefa
                    </Button>
                  )}
                </div>

                {/* Formulário nova tarefa */}
                {showNovaTarefa && (
                  <div className="mb-4 space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Responsável</p>
                        <Select value={novaResponsavel} onValueChange={setNovaResponsavel}>
                          <SelectTrigger className="h-8 border-border bg-background text-sm">
                            <SelectValue placeholder="Selecionar" />
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
                )}

                {/* Lista de tarefas */}
                {loadingTarefas ? (
                  <div className="space-y-2">
                    <Skeleton className="h-9 w-full rounded" />
                    <Skeleton className="h-9 w-full rounded" />
                    <Skeleton className="h-9 w-3/4 rounded" />
                  </div>
                ) : tarefas?.length ? (
                  <div className="divide-y divide-border/50 rounded-lg border border-border">
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
                  <p className="text-center text-sm text-muted-foreground py-6">
                    Nenhuma tarefa cadastrada.
                  </p>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
