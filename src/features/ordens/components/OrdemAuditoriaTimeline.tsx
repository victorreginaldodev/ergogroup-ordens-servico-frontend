import { useState } from 'react';
import {
  CheckCircle2, ChevronDown, ChevronUp, CircleDashed,
  FilePlus2, History, Settings2, Trash2, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuditoriaTimeline } from '../hooks';

// ── Helpers ──────────────────────────────────────────────────────────────────

const ACAO_ICON: Record<string, React.ReactNode> = {
  criacao:               <FilePlus2   className="h-3.5 w-3.5" />,
  atualizacao:           <Settings2   className="h-3.5 w-3.5" />,
  status:                <CircleDashed className="h-3.5 w-3.5" />,
  propagacao_status:     <Zap         className="h-3.5 w-3.5" />,
  liberacao_faturamento: <CheckCircle2 className="h-3.5 w-3.5" />,
  faturamento:           <CheckCircle2 className="h-3.5 w-3.5" />,
  liberacao_cobranca:    <CheckCircle2 className="h-3.5 w-3.5" />,
  contrato:              <Settings2   className="h-3.5 w-3.5" />,
  exclusao:              <Trash2      className="h-3.5 w-3.5" />,
  backfill:              <History     className="h-3.5 w-3.5" />,
};

const ACAO_COLOR: Record<string, string> = {
  criacao:               'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  atualizacao:           'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  status:                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  propagacao_status:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  liberacao_faturamento: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  faturamento:           'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  liberacao_cobranca:    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  contrato:              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  exclusao:              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  backfill:              'bg-gray-100 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400',
};

const ENTIDADE_BADGE: Record<string, string> = {
  ordem_servico: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  servico:       'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  tarefa:        'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  mini_os:       'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
}

function formatDateGroup(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(d);
}

function isoToDay(iso: string) {
  return iso.slice(0, 10);
}

// ── Alterações expandíveis ────────────────────────────────────────────────────

function Alteracoes({ data }: { data: Record<string, { antes: unknown; depois: unknown }> }) {
  const entries = Object.entries(data);
  if (!entries.length) return null;

  return (
    <div className="mt-2 space-y-1 rounded-lg border border-border bg-muted/40 px-3 py-2">
      {entries.map(([campo, { antes, depois }]) => (
        <div key={campo} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
          <span className="font-medium text-foreground">{campo}</span>
          <span className="text-muted-foreground line-through">{String(antes ?? '—')}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-medium text-foreground">{String(depois ?? '—')}</span>
        </div>
      ))}
    </div>
  );
}

// ── Item individual ───────────────────────────────────────────────────────────

function TimelineItem({ registro }: { registro: import('../services').RegistroAuditoria }) {
  const [expanded, setExpanded] = useState(false);
  const hasAlteracoes = Object.keys(registro.alteracoes ?? {}).length > 0;
  const isMigracao = registro.origem === 'migracao';

  return (
    <div className={cn('relative flex gap-3', isMigracao && 'opacity-60')}>
      {/* Ícone da ação */}
      <div className={cn(
        'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
        ACAO_COLOR[registro.acao] ?? 'bg-gray-100 text-gray-500',
      )}>
        {ACAO_ICON[registro.acao] ?? <History className="h-3.5 w-3.5" />}
      </div>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1 pb-4">
        {/* Linha 1: ação + entidade + objeto */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground">{registro.acao_display}</span>
          <span className={cn(
            'rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
            ENTIDADE_BADGE[registro.entidade] ?? 'bg-secondary text-secondary-foreground',
          )}>
            {registro.entidade_display}
          </span>
        </div>

        {/* Linha 2: objeto repr */}
        {registro.objeto_repr && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{registro.objeto_repr}</p>
        )}

        {/* Linha 3: usuário · data · origem migração */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>{registro.usuario_nome ?? 'Sistema'}</span>
          <span>{formatDateTime(registro.criado_em)}</span>
          {isMigracao && (
            <span className="italic">dado histórico</span>
          )}
        </div>

        {/* Motivo */}
        {registro.motivo && !isMigracao && (
          <p className="mt-1 text-xs text-muted-foreground">{registro.motivo}</p>
        )}

        {/* Alterações expandíveis */}
        {hasAlteracoes && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded
              ? <><ChevronUp className="h-3 w-3" /> Ocultar alterações</>
              : <><ChevronDown className="h-3 w-3" /> Ver alterações</>}
          </button>
        )}
        {expanded && <Alteracoes data={registro.alteracoes} />}
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

interface OrdemAuditoriaTimelineProps {
  ordemId: number;
}

export function OrdemAuditoriaTimeline({ ordemId }: OrdemAuditoriaTimelineProps) {
  const { data: registros, isLoading } = useAuditoriaTimeline(ordemId);

  if (isLoading) {
    return (
      <div className="space-y-4 py-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5 pt-1">
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!registros?.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Nenhum registro de auditoria encontrado.
      </p>
    );
  }

  // Agrupa por dia
  const porDia = registros.reduce<Record<string, typeof registros>>((acc, r) => {
    const dia = isoToDay(r.criado_em);
    (acc[dia] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6 py-2">
      {Object.entries(porDia).map(([dia, items]) => (
        <div key={dia}>
          {/* Separador de data */}
          <div className="mb-3 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground">
              {formatDateGroup(dia + 'T00:00:00')}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Linha vertical de conexão */}
          <div className="relative">
            <div className="absolute left-3.5 top-0 h-full w-px bg-border" />
            <div className="space-y-0">
              {items.map((r) => (
                <TimelineItem key={r.id} registro={r} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
