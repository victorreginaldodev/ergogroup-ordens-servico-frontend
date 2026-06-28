import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ChevronRight, Package, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrdemDetalhe, useServicosDeOrdem } from '../hooks';
import { OrdemHeroCard } from '../components/OrdemHeroCard';
import { OrdemInfoCards } from '../components/OrdemInfoCards';
import { ServicoRow } from '../components/ServicoRow';

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[160px] w-full rounded-2xl" />
      <Skeleton className="h-52 w-full rounded-xl" />
      <div className="space-y-px">
        <Skeleton className="h-12 rounded-none rounded-t-2xl" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12 rounded-none rounded-b-2xl" />
      </div>
    </div>
  );
}

const OrdemDetalhePage = () => {
  const { id } = useParams<{ id: string }>();
  const ordemId = id ? Number(id) : undefined;

  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: ordem, isLoading: loadingOrdem, isError } = useOrdemDetalhe(ordemId);
  const { data: servicos, isLoading: loadingServicos } = useServicosDeOrdem(ordemId);

  if (loadingOrdem) return <PageSkeleton />;

  if (isError || !ordem) {
    return (
      <div className="space-y-4">
        <Link
          to="/dashboard/orders"
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          Ordens de Serviço
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar OS</AlertTitle>
          <AlertDescription>
            Não foi possível recuperar os dados desta Ordem de Serviço.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const servicosFiltrados = servicos?.filter((s) => {
    if (!q) return true;
    const nome = s.repositorio_detail?.nome ?? s.repositorio_nome ?? `Serviço #${s.id}`;
    return nome.toLowerCase().includes(q) || s.descricao.toLowerCase().includes(q);
  }) ?? [];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/dashboard/orders" className="transition-colors hover:text-foreground">
          Ordens de Serviço
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="font-medium text-foreground">OS #{ordem.id}</span>
      </nav>

      <OrdemHeroCard
        ordem={ordem}
        servicosCount={loadingServicos ? undefined : (servicos?.length ?? 0)}
      />

      <OrdemInfoCards ordem={ordem} />

      {/* Serviços */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="text-sm font-semibold">Serviços</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {loadingServicos
                ? 'Carregando…'
                : `${servicos?.length ?? 0} serviço${(servicos?.length ?? 0) !== 1 ? 's' : ''} vinculado${(servicos?.length ?? 0) !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar serviço…"
              className="h-8 w-44 pl-8 text-sm"
            />
          </div>
        </div>

        {loadingServicos ? (
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 flex-1 rounded" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : !servicos?.length ? (
          <div className="flex flex-col items-center justify-center gap-2 p-10 text-muted-foreground">
            <Package className="h-8 w-8 opacity-30" />
            <p className="text-sm">Nenhum serviço vinculado a esta OS.</p>
          </div>
        ) : !servicosFiltrados.length ? (
          <div className="flex flex-col items-center justify-center gap-2 p-10 text-muted-foreground">
            <Search className="h-8 w-8 opacity-30" />
            <p className="text-sm">Nenhum resultado para "{search}".</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_3rem_6rem_6rem_7rem_1rem] items-center gap-4 border-b border-border bg-muted/50 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Serviço</span>
              <span className="justify-self-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tarefas</span>
              <span className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Início</span>
              <span className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Término</span>
              <span className="justify-self-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
              <span />
            </div>
            <div className="divide-y divide-border">
              {servicosFiltrados.map((s) => (
                <ServicoRow
                  key={s.id}
                  servico={s}
                  onClick={() => navigate(`/dashboard/orders/${ordemId}/services/${s.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default OrdemDetalhePage;
