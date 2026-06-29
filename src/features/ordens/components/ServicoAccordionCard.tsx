import { useState } from 'react';
import { ClipboardCheck, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '../utils';
import {
  useCreateTarefa,
  useDeleteTarefa,
  useTarefasDeServico,
  useUpdateTarefa,
} from '../hooks';
import { TarefaRow } from './TarefaRow';
import type { ServicoDetalhe, TarefaDetalhe, UpdateTarefaPayload } from '../services';
import type { UsuarioApi } from '@/services/users';

// ── Estilo da barra lateral por status ───────────────────────────────────────

const STATUS_TEXT: Record<string, string> = {
  aberto:       'Aberto',
  em_andamento: 'Em andamento',
  concluida:    'Concluído',
  cancelado:    'Cancelado',
  cancelada:    'Cancelado',
};

const STATUS_BADGE_STYLE: Record<string, string> = {
  aberto:       'border-red-200 bg-red-50 text-red-700',
  em_andamento: 'border-amber-200 bg-amber-50 text-amber-700',
  concluida:    'border-green-200 bg-green-50 text-green-700',
  cancelado:    'border-slate-200 bg-slate-100 text-slate-600',
  cancelada:    'border-slate-200 bg-slate-100 text-slate-600',
};

const STATUS_DOT: Record<string, string> = {
  aberto:       'bg-red-500',
  em_andamento: 'bg-amber-400',
  concluida:    'bg-green-500',
  cancelado:    'bg-slate-400',
  cancelada:    'bg-slate-400',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface ServicoAccordionCardProps {
  servico: ServicoDetalhe;
  ordemId: number;
  usuarios: UsuarioApi[];
  canManageTasks: boolean;
  index: number;
  currentUserId?: number;
  filterUserId?: number;
  initialTarefas?: TarefaDetalhe[];
}

// ── Componente ────────────────────────────────────────────────────────────────

export function ServicoAccordionCard({
  servico,
  ordemId,
  usuarios,
  canManageTasks,
  index,
  currentUserId,
  filterUserId,
  initialTarefas,
}: ServicoAccordionCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaResponsavel, setNovaResponsavel] = useState('');

  const nome = servico.repositorio_detail?.nome ?? servico.repositorio_nome ?? `Serviço #${servico.id}`;
  const serviceTag = `#S-${String(servico.id).padStart(2, '0')}`;

  const ctx = { servicoId: servico.id, ordemId };
  const { data: fetchedTarefas, isLoading: loadingFetched } = useTarefasDeServico(
    initialTarefas !== undefined ? undefined : servico.id,
  );
  const allTarefas   = initialTarefas ?? fetchedTarefas;
  const loadingTarefas = initialTarefas === undefined && loadingFetched;

  const tarefas = filterUserId
    ? allTarefas?.filter((t) => t.responsavel === filterUserId)
    : allTarefas;

  const createMutation = useCreateTarefa(ctx);
  const updateMutation = useUpdateTarefa(ctx);
  const deleteMutation = useDeleteTarefa(ctx);
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleOpenDialog = () => {
    setNovaDescricao('');
    setNovaResponsavel('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setNovaDescricao('');
    setNovaResponsavel('');
    setDialogOpen(false);
  };

  const handleCriarTarefa = () => {
    if (!novaDescricao.trim() || !novaResponsavel) return;
    createMutation.mutate(
      { servico: servico.id, descricao: novaDescricao.trim(), responsavel: Number(novaResponsavel) },
      { onSuccess: handleCloseDialog },
    );
  };

  const metaItems = [
    { label: 'Início',      value: formatDate(servico.data_inicio)  ?? '—' },
    { label: 'Término',     value: formatDate(servico.data_termino) ?? '—' },
    { label: 'Responsável', value: servico.terminado_por_nome       ?? '—' },
    {
      label: 'Tarefas',
      value: loadingTarefas ? '…' : `${allTarefas?.length ?? 0}`,
    },
  ];

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
      {/* ── Cabeçalho ── */}
      <div className="flex items-center justify-between gap-3 px-[22px] py-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold leading-snug tracking-tight text-foreground">
            {nome}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground/70">
            {serviceTag}
          </span>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold',
              STATUS_BADGE_STYLE[servico.status] ?? 'border-border bg-muted text-muted-foreground',
            )}
          >
            <span className={cn('h-[7px] w-[7px] rounded-full', STATUS_DOT[servico.status] ?? 'bg-gray-400')} />
            {STATUS_TEXT[servico.status] ?? servico.status_display}
          </span>
        </div>
      </div>

      {/* ── Descrição ── */}
      {servico.descricao && (
        <div className="border-t border-border px-[22px] py-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/75">
            Descrição
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {servico.descricao}
          </p>
        </div>
      )}

      {/* ── Meta strip — caixa com borda própria ── */}
      <div className="px-[22px] pb-4 pt-1">
        <div className="grid grid-cols-4 overflow-hidden rounded-[10px] border border-border divide-x divide-border">
          {metaItems.map((m) => (
            <div key={m.label} className="px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/70">
                {m.label}
              </p>
              <p className="mt-0.5 truncate text-sm font-bold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Seção de tarefas ── */}
      <div className="border-t border-border">
        {/* Header da seção */}
        <div className="flex items-center justify-between gap-3 px-[22px] py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Tarefas</p>
            {!loadingTarefas && allTarefas !== undefined && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                {allTarefas.length}
              </span>
            )}
          </div>
          {canManageTasks && (
            <Button
              type="button"
              variant="hero"
              size="sm"
              className="h-8 rounded-[9px] px-3.5 text-xs font-bold shadow-none"
              onClick={handleOpenDialog}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nova tarefa
            </Button>
          )}
        </div>

        {/* Conteúdo da lista */}
        {loadingTarefas ? (
          <div className="space-y-px border-t border-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 px-[22px] py-3">
                <Skeleton className="mt-0.5 h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ))}
          </div>
        ) : tarefas?.length ? (
          <div className="divide-y divide-border border-t border-border">
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
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="border-t border-border px-[22px] pb-[22px] pt-2">
            <div className="flex min-h-[208px] flex-col items-center justify-center rounded-[10px] border border-dashed border-border bg-card text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-muted">
                <ClipboardCheck className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <div className="mt-3">
                <p className="text-sm font-semibold text-foreground">Nenhuma tarefa neste serviço</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Crie a primeira tarefa para começar.
                </p>
              </div>
              {canManageTasks && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-8 rounded-[9px] px-3.5 text-xs font-bold"
                  onClick={handleOpenDialog}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Criar primeira tarefa
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal — Nova tarefa ── */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Nova tarefa — {nome}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Responsável</p>
              <Select value={novaResponsavel} onValueChange={setNovaResponsavel}>
                <SelectTrigger className="h-9 border-border bg-background text-sm">
                  <SelectValue placeholder="Selecionar responsável" />
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

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Descrição</p>
              <Textarea
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                placeholder="Descreva a tarefa..."
                className="min-h-24 resize-none border-border bg-background text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={createMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="hero"
              onClick={handleCriarTarefa}
              disabled={!novaDescricao.trim() || !novaResponsavel || createMutation.isPending}
            >
              {createMutation.isPending
                ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                : <Plus    className="mr-1.5 h-4 w-4" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
