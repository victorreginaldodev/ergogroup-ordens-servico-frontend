import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRole } from '@/hooks/useUserRole';
import { useUsers } from '@/services/users';
import { authService } from '@/services/auth';
import {
  useOrdemDetalhe,
  useServicosDeOrdem,
  useTarefasDeServicos,
} from '../hooks';
import { OrdemAdministrativePanel } from '../components/OrdemAdministrativePanel';
import { OrdemHeroCard } from '../components/OrdemHeroCard';
import { OrdemPdfButton } from '../components/OrdemPdfButton';
import { ServicoAccordionCard } from '../components/ServicoAccordionCard';

type FilterMode = 'all' | 'mine';

function PageSkeleton() {
  return (
    <div className="w-full space-y-[30px] animate-fade-in">
      <Skeleton className="h-[188px] w-full rounded-[14px]" />
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-4 w-52 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-72 rounded-[10px]" />
            <Skeleton className="h-10 w-[220px] rounded-[10px]" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-56 w-full rounded-[14px]" />
        ))}
      </div>
    </div>
  );
}

const OrdemDetalhePage = () => {
  const { id } = useParams<{ id: string }>();
  const ordemId = id ? Number(id) : undefined;

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const { canManageTasks } = useUserRole();
  const { data: ordem, isLoading: loadingOrdem, isError } = useOrdemDetalhe(ordemId);
  const { data: servicos = [], isLoading: loadingServicos } = useServicosDeOrdem(ordemId);
  const { data: usuarios = [] } = useUsers();
  const { tarefasPorServico, isLoading: loadingTarefas } = useTarefasDeServicos(servicos);

  const currentProfile = authService.getCurrentUser();
  const rawCurrentUserId = currentProfile?.user?.id ?? (currentProfile as any)?.id;
  const currentUserId = rawCurrentUserId != null ? Number(rawCurrentUserId) : undefined;

  const myTasksCount = useMemo(() => {
    if (!currentUserId) return 0;

    return Object.values(tarefasPorServico)
      .flat()
      .filter((tarefa) => tarefa.responsavel === currentUserId)
      .length;
  }, [currentUserId, tarefasPorServico]);

  const q = search.trim().toLowerCase();
  const servicosFiltrados = useMemo(() => {
    return servicos
      .filter((servico) => {
        if (!q) return true;

        const nome =
          servico.repositorio_detail?.nome ??
          servico.repositorio_nome ??
          `Serviço #${servico.id}`;

        return nome.toLowerCase().includes(q) || servico.descricao?.toLowerCase().includes(q);
      })
      .filter((servico) => {
        if (filterMode !== 'mine') return true;
        if (!currentUserId) return false;
        if (loadingTarefas) return true;

        return (tarefasPorServico[servico.id] ?? []).some(
          (tarefa) => tarefa.responsavel === currentUserId,
        );
      });
  }, [currentUserId, filterMode, loadingTarefas, q, servicos, tarefasPorServico]);

  const filterUserId = filterMode === 'mine' ? currentUserId : undefined;

  if (loadingOrdem) return <PageSkeleton />;

  if (isError || !ordem) {
    return (
      <div className="w-full animate-fade-in">
        <Alert variant="destructive" className="rounded-[14px]">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar OS</AlertTitle>
          <AlertDescription>
            Não foi possível recuperar os dados desta Ordem de Serviço.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const servicesCount = servicos.length;

  return (
    <div className="w-full space-y-[30px] animate-fade-in">
      <OrdemHeroCard
        ordem={ordem}
        servicosCount={loadingServicos ? undefined : servicesCount}
        pdfButton={
          <OrdemPdfButton
            ordem={ordem}
            servicos={servicos}
            tarefasPorServico={tarefasPorServico}
            disabled={loadingServicos || loadingTarefas}
          />
        }
      />

      <OrdemAdministrativePanel ordem={ordem} />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-bold leading-none">Serviços</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {loadingServicos
                ? 'Carregando...'
                : filterMode === 'mine'
                  ? loadingTarefas
                    ? 'Carregando tarefas atribuídas a você...'
                    : `${myTasksCount} tarefa${myTasksCount !== 1 ? 's' : ''} atribuída${myTasksCount !== 1 ? 's' : ''} a você`
                  : `${servicesCount} serviço${servicesCount !== 1 ? 's' : ''} vinculado${servicesCount !== 1 ? 's' : ''} a esta OS`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-[10px] border border-border bg-card p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <Button
                size="sm"
                variant={filterMode === 'all' ? 'hero' : 'ghost'}
                className="h-8 rounded-[7px] px-3.5 text-xs font-bold shadow-none"
                onClick={() => setFilterMode('all')}
              >
                Todas as tarefas
              </Button>
              <Button
                size="sm"
                variant={filterMode === 'mine' ? 'hero' : 'ghost'}
                className="h-8 rounded-[7px] px-3.5 text-xs font-semibold shadow-none"
                onClick={() => setFilterMode('mine')}
              >
                Minhas tarefas
                {(myTasksCount > 0 || loadingTarefas) && (
                  <span
                    className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-bold text-muted-foreground data-[active=true]:bg-white/25 data-[active=true]:text-white"
                    data-active={filterMode === 'mine'}
                  >
                    {loadingTarefas ? '...' : myTasksCount}
                  </span>
                )}
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar serviço..."
                className="h-10 w-[220px] rounded-[10px] border-border bg-card pl-8 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              />
            </div>
          </div>
        </div>

        {loadingServicos ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 w-full rounded-[14px]" />
            ))}
          </div>
        ) : !servicos.length ? (
          <div className="rounded-[14px] border border-border bg-card p-6 text-sm text-muted-foreground shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            Nenhum serviço vinculado a esta OS.
          </div>
        ) : !servicosFiltrados.length ? (
          <div className="flex items-center gap-2 rounded-[14px] border border-border bg-card p-6 text-muted-foreground shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
            <Search className="h-5 w-5 opacity-40" />
            <p className="text-sm">Nenhum resultado para "{search}".</p>
          </div>
        ) : (
          <div className="space-y-4">
            {servicosFiltrados.map((servico, index) => (
              <ServicoAccordionCard
                key={servico.id}
                servico={servico}
                ordemId={ordemId!}
                usuarios={usuarios}
                canManageTasks={canManageTasks}
                index={index + 1}
                currentUserId={currentUserId}
                filterUserId={filterUserId}
                initialTarefas={tarefasPorServico[servico.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdemDetalhePage;
