import { useState } from 'react';
import { CalendarClock, CalendarDays, Loader2, Pencil, Save, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { avatarColor, formatDate, initials } from '../utils';
import type { UsuarioApi } from '@/services/users';
import type { TarefaDetalhe, UpdateTarefaPayload } from '../services';

// ── Status ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  aberta:       'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/30 dark:text-red-400',
  em_andamento: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-400',
  concluida:    'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/30 dark:text-green-400',
  cancelada:    'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400',
};

const STATUS_DOT: Record<string, string> = {
  aberta:       'bg-red-500',
  em_andamento: 'bg-amber-400',
  concluida:    'bg-green-500',
  cancelada:    'bg-gray-400',
};

// ── Props ────────────────────────────────────────────────────────────────────

interface TarefaRowProps {
  tarefa: TarefaDetalhe;
  usuarios: UsuarioApi[];
  onStatusChange: (id: number, status: string) => void;
  onEdit: (id: number, payload: UpdateTarefaPayload) => void;
  onDelete: (id: number) => void;
  isPending?: boolean;
  canManage?: boolean;
  currentUserId?: number;
}

// ── Componente ───────────────────────────────────────────────────────────────

export function TarefaRow({
  tarefa,
  usuarios,
  onStatusChange,
  onEdit,
  onDelete,
  isPending,
  canManage,
  currentUserId,
}: TarefaRowProps) {
  const [editing, setEditing]           = useState(false);
  const [editDescricao, setEditDescricao]       = useState(tarefa.descricao ?? '');
  const [editResponsavel, setEditResponsavel]   = useState(String(tarefa.responsavel));

  const isCurrentUser = currentUserId !== undefined && tarefa.responsavel === currentUserId;

  const handleSave = () => {
    onEdit(tarefa.id, {
      descricao:   editDescricao.trim(),
      responsavel: editResponsavel ? Number(editResponsavel) : undefined,
    });
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditDescricao(tarefa.descricao ?? '');
    setEditResponsavel(String(tarefa.responsavel));
    setEditing(false);
  };

  const handleStartEdit = () => {
    setEditDescricao(tarefa.descricao ?? '');
    setEditResponsavel(String(tarefa.responsavel));
    setEditing(true);
  };

  const nome = tarefa.responsavel_nome ?? '—';
  const avatarCls = avatarColor(nome);
  const monogram = nome !== '—' ? initials(nome) : '?';
  const descricao = tarefa.descricao?.trim();
  const assignedAt = formatDate(tarefa.criada_em);
  const startAt = formatDate(tarefa.data_inicio);
  const endAt = formatDate(tarefa.data_termino);

  /* ── Modo edição ── */
  if (editing) {
    return (
      <div className="space-y-3 bg-muted/30 px-5 py-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Responsável</p>
          <Select value={editResponsavel} onValueChange={setEditResponsavel}>
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
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Descrição</p>
          <Textarea
            value={editDescricao}
            onChange={(e) => setEditDescricao(e.target.value)}
            className="min-h-20 resize-none border-border bg-background text-sm"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancelEdit} disabled={isPending}>
            <X className="mr-1 h-3.5 w-3.5" /> Cancelar
          </Button>
          <Button variant="hero" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending
              ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              : <Save    className="mr-1 h-3.5 w-3.5" />}
            Salvar
          </Button>
        </div>
      </div>
    );
  }

  /* ── Modo leitura ── */
  return (
    <div
      className={cn(
        'flex gap-3 px-[22px] py-[13px] transition-colors hover:bg-muted/20',
        isCurrentUser && 'border-l-[3px] border-l-primary/80 bg-primary/[0.06] pl-[19px] hover:bg-primary/[0.08] dark:bg-primary/[0.08]',
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'mt-0.5 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-bold',
          avatarCls,
          isCurrentUser && 'ring-2 ring-primary/20',
        )}
      >
        {monogram}
      </div>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        {/* Linha superior */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-foreground">{nome}</span>

          {isCurrentUser && (
            <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              Sua tarefa
            </span>
          )}

          {/* Status + ações — empurrados para direita */}
          <div className="ml-auto flex items-center gap-2">
            {canManage ? (
              <Select
                value={tarefa.status}
                onValueChange={(val) => onStatusChange(tarefa.id, val)}
                disabled={isPending}
              >
                <SelectTrigger
                  className={cn(
                    'h-[30px] w-auto gap-1.5 rounded-full border px-3 py-0 text-xs font-semibold shadow-none focus:ring-0 focus:ring-offset-0',
                    STATUS_BADGE[tarefa.status],
                  )}
                >
                  <span className={cn('h-[7px] w-[7px] shrink-0 rounded-full', STATUS_DOT[tarefa.status])} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
                  STATUS_BADGE[tarefa.status],
                )}
              >
                  <span className={cn('h-[7px] w-[7px] shrink-0 rounded-full', STATUS_DOT[tarefa.status])} />
                {tarefa.status_display}
              </span>
            )}

            {canManage && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={handleStartEdit}
                  disabled={isPending}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(tarefa.id)}
                  disabled={isPending}
                >
                  {isPending
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Trash2  className="h-3 w-3" />}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2 py-1 text-[11px] text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            <span className="font-semibold">Atribuída</span>
            <span className="tabular-nums text-foreground/80">{assignedAt ?? '—'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2 py-1 text-[11px] text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="font-semibold">Início</span>
            <span className="tabular-nums text-foreground/80">{startAt ?? '—'}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2 py-1 text-[11px] text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="font-semibold">Fim</span>
            <span className="tabular-nums text-foreground/80">{endAt ?? '—'}</span>
          </span>
        </div>

        {/* Descrição */}
        {descricao && (
          <p
            className={cn(
              'mt-2 text-sm leading-snug text-muted-foreground',
              tarefa.status === 'cancelada' && 'line-through opacity-60',
            )}
          >
            {descricao}
          </p>
        )}
      </div>
    </div>
  );
}
