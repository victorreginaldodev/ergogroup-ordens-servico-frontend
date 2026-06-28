import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate } from '../utils';
import type { ServicoDetalhe } from '../services';

const STATUS_STYLE: Record<string, string> = {
  aberto:       'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  em_andamento: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  concluida:    'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelado:    'bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400',
};

const STATUS_DOT: Record<string, string> = {
  aberto:       'bg-red-500',
  em_andamento: 'bg-yellow-500',
  concluida:    'bg-green-500',
  cancelado:    'bg-gray-400',
};

interface ServicoHeroCardProps {
  servico: ServicoDetalhe;
  ordemId: number;
  tarefasCount?: number;
}

export function ServicoHeroCard({ servico, ordemId, tarefasCount }: ServicoHeroCardProps) {
  const nome = servico.repositorio_detail?.nome ?? servico.repositorio_nome ?? `Serviço #${servico.id}`;

  const meta = [
    { label: 'Criado em',    value: formatDate(servico.criado_em) ?? '—' },
    { label: 'Início',       value: formatDate(servico.data_inicio) ?? '—' },
    { label: 'Término',      value: formatDate(servico.data_termino) ?? '—' },
    { label: 'Terminado por', value: servico.terminado_por_nome ?? '—' },
    {
      label: 'Tarefas',
      value: tarefasCount !== undefined ? `${tarefasCount} tarefa${tarefasCount !== 1 ? 's' : ''}` : '—',
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div className="flex min-w-0 flex-col gap-2.5">
          <span
            className={cn(
              'inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
              STATUS_STYLE[servico.status] ?? 'bg-secondary text-secondary-foreground',
            )}
          >
            <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT[servico.status] ?? 'bg-gray-400')} />
            {servico.status_display}
          </span>

          <h1 className="text-2xl font-bold leading-tight tracking-tight">{nome}</h1>

          <p className="text-sm font-medium text-muted-foreground">
            OS #{ordemId}
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to={`/dashboard/orders/${ordemId}`}>
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Voltar para OS
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 border-t border-border bg-muted/30 sm:grid-cols-5 sm:divide-x sm:divide-border">
        {meta.map((m, i) => (
          <div
            key={m.label}
            className={cn('px-4 py-3', i > 0 && i % 2 !== 0 && 'border-l border-border sm:border-l-0')}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{m.label}</p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
