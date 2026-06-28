import { useState } from 'react';
import {
  CheckCircle2, Circle, CircleDashed, Loader2,
  Pencil, Save, Trash2, X, XCircle,
  User, CalendarRange,
} from 'lucide-react';
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
import { formatDate } from '../utils';
import type { UsuarioApi } from '@/services/users';
import type { TarefaDetalhe, UpdateTarefaPayload } from '../services';

const STATUS_ICON: Record<string, React.ReactNode> = {
  concluida:    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />,
  em_andamento: <Circle       className="h-4 w-4 text-yellow-500" />,
  aberta:       <CircleDashed className="h-4 w-4 text-red-500" />,
  cancelada:    <XCircle      className="h-4 w-4 text-muted-foreground" />,
};

const STATUS_BADGE: Record<string, string> = {
  aberta:       'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  em_andamento: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  concluida:    'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelada:    'bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400',
};

interface TarefaRowProps {
  tarefa: TarefaDetalhe;
  usuarios: UsuarioApi[];
  onStatusChange: (id: number, status: string) => void;
  onEdit: (id: number, payload: UpdateTarefaPayload) => void;
  onDelete: (id: number) => void;
  isPending?: boolean;
  canManage?: boolean;
}

export function TarefaRow({
  tarefa,
  usuarios,
  onStatusChange,
  onEdit,
  onDelete,
  isPending,
  canManage,
}: TarefaRowProps) {
  const [editing, setEditing] = useState(false);
  const [editDescricao, setEditDescricao]     = useState(tarefa.descricao ?? '');
  const [editResponsavel, setEditResponsavel] = useState(String(tarefa.responsavel));

  const handleSave = () => {
    onEdit(tarefa.id, {
      descricao:   editDescricao.trim() || undefined,
      responsavel: editResponsavel ? Number(editResponsavel) : undefined,
    });
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditDescricao(tarefa.descricao ?? '');
    setEditResponsavel(String(tarefa.responsavel));
    setEditing(false);
  };

  /* ── Modo edição ── */
  if (editing) {
    return (
      <div className="space-y-3 bg-muted/40 p-4">
        <div className="space-y-1">
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
        <div className="space-y-1">
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
    <div className="space-y-3 p-4">

      {/* Linha 1: label + ações */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tarefa</p>
        {canManage && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(true)} disabled={isPending}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => onDelete(tarefa.id)} disabled={isPending}
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </Button>
          </div>
        )}
      </div>

      {/* Linha 2: descrição destacada */}
      <p className={cn(
        'rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm leading-relaxed',
        tarefa.status === 'cancelada' ? 'line-through text-muted-foreground' : 'text-foreground',
      )}>
        {tarefa.descricao ?? <span className="italic text-muted-foreground">Sem descrição</span>}
      </p>

      <div className="border-t border-border" />

      {/* Linha 3: responsável · início · término */}
      <div className="grid grid-cols-3 gap-x-4">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground">Responsável</p>
          <p className="text-sm">{tarefa.responsavel_nome ?? '—'}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground">Início</p>
          <p className="text-sm">{formatDate(tarefa.data_inicio) ?? '—'}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground">Término</p>
          <p className="text-sm">{formatDate(tarefa.data_termino) ?? '—'}</p>
        </div>
      </div>

      {/* Linha 4: status */}
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground">Status</p>
        {canManage ? (
          <Select value={tarefa.status} onValueChange={(val) => onStatusChange(tarefa.id, val)} disabled={isPending}>
            <SelectTrigger className={cn('h-6 w-auto gap-1 rounded-full border-0 px-2 py-0 text-xs font-semibold shadow-none focus:ring-0', STATUS_BADGE[tarefa.status])}>
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
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_BADGE[tarefa.status])}>
            {tarefa.status_display}
          </span>
        )}
      </div>

    </div>
  );
}
