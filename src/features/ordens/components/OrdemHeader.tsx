import { Link } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatDate } from '../utils';
import { StatusBadge } from './StatusBadge';
import type { OrdemServicoDetalhe } from '../services';

const prioridadeStyles: Record<string, string> = {
  baixa: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700',
  media: 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  alta:  'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
};

interface OrdemHeaderProps {
  ordem: OrdemServicoDetalhe;
}

export function OrdemHeader({ ordem }: OrdemHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-2">
        <Link
          to="/dashboard/orders"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Ordens de Serviço
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold">OS #{ordem.id}</h1>
          <StatusBadge status={ordem.status} label={ordem.status_display} />
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
              prioridadeStyles[ordem.prioridade],
            )}
          >
            {ordem.prioridade_display}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">
          {ordem.cliente_detail.nome}
          <span className="mx-2">·</span>
          Criada em {formatDate(ordem.data_criacao)}
          {ordem.criado_por_nome && (
            <> por <span className="text-foreground">{ordem.criado_por_nome}</span></>
          )}
        </p>
      </div>

      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link to={`/dashboard/orders/${ordem.id}/edit`}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Editar OS
        </Link>
      </Button>
    </div>
  );
}
