import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency } from '../utils';
import type { OrdemServicoDetalhe } from '../services';

const STATUS_DOT: Record<string, string> = {
  aberta:       'bg-blue-500',
  em_andamento: 'bg-yellow-500',
  concluida:    'bg-green-500',
  cancelada:    'bg-gray-400',
};

const STATUS_STYLE: Record<string, string> = {
  aberta:       'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  em_andamento: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  concluida:    'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelada:    'bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400',
};

const PRIORIDADE_DOT: Record<string, string> = {
  baixa: 'bg-slate-400',
  media: 'bg-orange-400',
  alta:  'bg-red-500',
};

const PRIORIDADE_STYLE: Record<string, string> = {
  baixa: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
  media: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  alta:  'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

interface OrdemHeroCardProps {
  ordem: OrdemServicoDetalhe;
  servicosCount?: number;
}

export function OrdemHeroCard({ ordem, servicosCount }: OrdemHeroCardProps) {
  const meta = [
    { label: 'Criação',     value: formatDate(ordem.data_criacao) ?? '—' },
    { label: 'Criado por',  value: ordem.criado_por_nome ?? '—' },
    { label: 'Prioridade',  value: ordem.prioridade_display },
    {
      label: 'Serviços',
      value: servicosCount !== undefined
        ? `${servicosCount} serviço${servicosCount !== 1 ? 's' : ''}`
        : '—',
    },
    { label: 'Valor total', value: formatCurrency(ordem.valor) },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Topo: badges + título + ações */}
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-2.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                STATUS_STYLE[ordem.status] ?? 'bg-secondary text-secondary-foreground',
              )}
            >
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_DOT[ordem.status] ?? 'bg-gray-400')} />
              {ordem.status_display}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                PRIORIDADE_STYLE[ordem.prioridade] ?? 'bg-secondary text-secondary-foreground',
              )}
            >
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', PRIORIDADE_DOT[ordem.prioridade] ?? 'bg-gray-400')} />
              {ordem.prioridade_display}
            </span>
          </div>

          <h1 className="text-2xl font-bold leading-tight tracking-tight">
            OS #{ordem.id}
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            {ordem.cliente_detail.nome}
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to={`/dashboard/orders/${ordem.id}/edit`}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Editar OS
          </Link>
        </Button>
      </div>

      {/* Meta strip */}
      <div className="grid grid-cols-2 border-t border-border bg-muted/30 sm:grid-cols-5 sm:divide-x sm:divide-border">
        {meta.map((m, i) => (
          <div
            key={m.label}
            className={cn(
              'px-4 py-3',
              i > 0 && i % 2 !== 0 && 'border-l border-border sm:border-l-0',
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {m.label}
            </p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
