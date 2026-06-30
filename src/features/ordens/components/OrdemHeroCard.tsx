import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Pencil, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoneyValue } from '@/components/common/MoneyValue';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency, formatDaysCount } from '../utils';
import type { OrdemServicoDetalhe } from '../services';

const STATUS_DOT: Record<string, string> = {
  aberta:       'bg-red-500',
  em_andamento: 'bg-amber-400',
  concluida:    'bg-green-500',
  cancelada:    'bg-gray-400',
};

const STATUS_STYLE: Record<string, string> = {
  aberta:       'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  em_andamento: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  concluida:    'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelada:    'bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400',
};

const PRIORIDADE_STYLE: Record<string, string> = {
  baixa: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
  media: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400',
  alta:  'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

interface OrdemHeroCardProps {
  ordem: OrdemServicoDetalhe;
  servicosCount?: number;
  pdfButton?: React.ReactNode;
}

export function OrdemHeroCard({ ordem, servicosCount, pdfButton }: OrdemHeroCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isDone = ordem.status === 'concluida';

  const meta = [
    { label: 'Criação',    value: formatDate(ordem.data_criacao) ?? '—' },
    {
      label: isDone ? 'Até conclusão' : 'Em aberto',
      value: formatDaysCount(
        isDone ? ordem.dias_entre_criacao_e_conclusao : ordem.dias_em_aberto,
      ) ?? '—',
    },
    { label: 'Criado por', value: ordem.criado_por_nome ?? '—' },
    {
      label: 'Serviços',
      value: servicosCount !== undefined
        ? `${servicosCount} serviço${servicosCount !== 1 ? 's' : ''}`
        : '—',
    },
    { label: 'Valor total', value: <MoneyValue value={ordem.valor} formatter={formatCurrency} /> },
  ];

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
      {/* Topo */}
      <div className="flex flex-wrap items-start justify-between gap-5 p-5 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-2.5 min-w-0">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                STATUS_STYLE[ordem.status] ?? 'bg-secondary text-secondary-foreground',
              )}
            >
              <span className={cn('h-[7px] w-[7px] shrink-0 rounded-full', STATUS_DOT[ordem.status] ?? 'bg-gray-400')} />
              {ordem.status_display}
            </span>

            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                PRIORIDADE_STYLE[ordem.prioridade] ?? 'bg-secondary text-secondary-foreground',
              )}
            >
              <Star className="h-3 w-3 shrink-0" strokeWidth={1.5} />
              Prioridade {ordem.prioridade_display}
            </span>
          </div>

          <h1 className="text-2xl font-bold leading-tight tracking-tight">
            OS #{ordem.id}
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            {ordem.cliente_detail.nome}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {pdfButton}
          <Button asChild variant="outline" size="sm" className="h-9 rounded-[10px] px-4 font-bold">
            <Link to={`/dashboard/orders/${ordem.id}/edit`}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Editar OS
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-[10px]"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed
              ? <ChevronDown className="h-4 w-4" />
              : <ChevronUp   className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Meta strip — colapsável */}
      {!collapsed && (
        <div className="grid grid-cols-2 border-t border-border bg-muted/30 sm:grid-cols-5 sm:divide-x sm:divide-border">
          {meta.map((m, i) => (
            <div
              key={m.label}
              className={cn(
                'px-6 py-3.5',
                i % 2 === 1 && 'border-l border-border sm:border-l-0',
                i > 1 && i % 2 === 0 && 'border-t border-border sm:border-t-0',
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/75">
                {m.label}
              </p>
              <p className="mt-1 truncate text-sm font-bold text-foreground">{m.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
