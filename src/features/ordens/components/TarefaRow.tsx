import { useState } from 'react';
import { Ban, Loader2, MoreVertical, Pencil, Save, X } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { avatarColor, formatDate, initials, isPrazoVencido } from '../utils';
import { nextStatus, previousStatus, TarefaStatusControl } from './TarefaStatusControl';
import type { UsuarioApi } from '@/features/usuarios/services';
import type { TarefaDetalhe, UpdateTarefaPayload } from '../services';

// ── Props ────────────────────────────────────────────────────────────────────

interface TarefaRowProps {
  tarefa: TarefaDetalhe;
  usuarios: UsuarioApi[];
  onStatusChange: (id: number, status: string) => void;
  onEdit: (id: number, payload: UpdateTarefaPayload) => void;
  onDelete: (id: number) => void;
  isPending?: boolean;
  /** Líder/Sub-Líder Técnico: controle total (status, editar, cancelar, excluir) em qualquer tarefa. */
  canManage?: boolean;
  /** Técnico: só pode avançar/reverter o status das próprias tarefas — nunca editar/cancelar/excluir. */
  allowSelfStatusUpdate?: boolean;
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
  allowSelfStatusUpdate,
  currentUserId,
}: TarefaRowProps) {
  const [editing, setEditing]           = useState(false);
  const [editDescricao, setEditDescricao]       = useState(tarefa.descricao ?? '');
  const [editResponsavel, setEditResponsavel]   = useState(String(tarefa.responsavel));
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const isCurrentUser = currentUserId !== undefined && tarefa.responsavel === currentUserId;
  const canControlStatus = !!canManage || (!!allowSelfStatusUpdate && isCurrentUser);

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

  const handleAdvance = () => {
    const next = nextStatus(tarefa.status);
    if (next) onStatusChange(tarefa.id, next);
  };

  const handleRevert = () => {
    const previous = previousStatus(tarefa.status);
    if (previous) onStatusChange(tarefa.id, previous);
  };

  const handleConfirmCancelar = () => {
    onStatusChange(tarefa.id, 'cancelada');
    setConfirmCancelOpen(false);
  };

  const nome = tarefa.responsavel_nome ?? '—';
  const avatarCls = avatarColor(nome);
  const monogram = nome !== '—' ? initials(nome) : '?';
  const descricao = tarefa.descricao?.trim();
  const prazo = formatDate(tarefa.prazo);
  const overdue = isPrazoVencido(tarefa.prazo) && tarefa.status !== 'concluida' && tarefa.status !== 'cancelada';
  const canCancelar = tarefa.status !== 'cancelada' && tarefa.status !== 'concluida';

  /* ── Modo edição ── */
  if (editing) {
    return (
      <div className="space-y-3 bg-muted/30 px-[18px] py-4">
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
        'flex items-center gap-3.5 border-t border-border px-[18px] py-3 transition-colors hover:bg-muted/20',
        isCurrentUser ? 'border-l-[3px] border-l-primary/70 pl-[15px]' : overdue && 'border-l-[3px] border-l-red-500/70 pl-[15px]',
      )}
    >
      {/* Controle de status — largura fixa */}
      <div className="flex w-[190px] shrink-0 items-center gap-1.5">
        <TarefaStatusControl
          status={tarefa.status}
          onAdvance={handleAdvance}
          onRevert={handleRevert}
          canManage={canControlStatus}
          disabled={isPending}
        />
      </div>

      {/* Descrição + meta */}
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'truncate text-sm text-foreground',
            isCurrentUser ? 'font-bold' : 'font-medium',
            tarefa.status === 'cancelada' && 'line-through opacity-60',
          )}
        >
          {descricao || `Tarefa #${tarefa.id}`}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] font-medium text-muted-foreground">
          {isCurrentUser && (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              Sua tarefa
            </span>
          )}
          <span>
            Prazo{' '}
            <span className={cn('font-semibold', overdue ? 'text-red-500' : 'text-foreground/80')}>
              {prazo ?? '—'}
            </span>
          </span>
          {overdue && (
            <span className="text-[10px] font-bold uppercase tracking-wide text-red-500">Atrasada</span>
          )}
        </div>
      </div>

      {/* Responsável + ações */}
      <div className="flex shrink-0 items-center gap-2">
        <div
          className={cn(
            'flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-bold',
            avatarCls,
          )}
        >
          {monogram}
        </div>
        <span className="whitespace-nowrap text-xs font-medium text-foreground">{nome}</span>

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                disabled={isPending}
              >
                {isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <MoreVertical className="h-3.5 w-3.5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleStartEdit}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
              </DropdownMenuItem>
              {canCancelar && (
                <DropdownMenuItem
                  onClick={() => setConfirmCancelOpen(true)}
                  className="text-amber-600 focus:text-amber-600"
                >
                  <Ban className="mr-2 h-3.5 w-3.5" /> Cancelar tarefa
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onDelete(tarefa.id)}
                className="text-destructive focus:text-destructive"
              >
                <X className="mr-2 h-3.5 w-3.5" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ── Confirmação de cancelamento ── */}
      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar esta tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              A tarefa será marcada como cancelada. Essa ação não avança nem reverte pelo controle de status — só é possível reatribuir ou editar depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancelar} className="bg-amber-600 hover:bg-amber-700">
              Cancelar tarefa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
