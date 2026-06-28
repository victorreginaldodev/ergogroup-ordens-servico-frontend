import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '../utils';
import { useTarefasDeServico } from '../hooks';
import type { ServicoDetalhe } from '../services';

const STATUS_BADGE: Record<string, string> = {
  aberto:       'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  em_andamento: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  concluida:    'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelado:    'bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400',
};

interface ServicoRowProps {
  servico: ServicoDetalhe;
  onClick: () => void;
}

export function ServicoRow({ servico, onClick }: ServicoRowProps) {
  const nome = servico.repositorio_detail?.nome ?? servico.repositorio_nome ?? `Serviço #${servico.id}`;
  const { data: tarefas } = useTarefasDeServico(servico.id);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group grid w-full grid-cols-[1fr_3rem_6rem_6rem_7rem_1rem] items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40"
    >
      <p className="truncate text-sm font-medium">{nome}</p>

      <span className="justify-self-center text-xs text-muted-foreground">
        {tarefas !== undefined ? (
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-foreground">
            {tarefas.length}
          </span>
        ) : '—'}
      </span>

      <span className="text-center text-xs text-muted-foreground">
        {formatDate(servico.data_inicio) ?? '—'}
      </span>

      <span className="text-center text-xs text-muted-foreground">
        {formatDate(servico.data_termino) ?? '—'}
      </span>

      <span className="justify-self-center">
        <span className={cn('whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold', STATUS_BADGE[servico.status] ?? 'bg-secondary text-secondary-foreground')}>
          {servico.status_display}
        </span>
      </span>

      <ChevronRight className="h-4 w-4 justify-self-end text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
