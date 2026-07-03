import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRole } from '@/hooks/useUserRole';
import { useUsers } from '@/services/users';
import { useOrdensLista, useServicosResumo, useTarefasResumo } from '../hooks';
import { avatarColor, formatDate, formatCurrency, formatDaysCount, getStatusLabel, getPriorityLabel, initials, STATUS_DOT, PRIORITY_DOT } from '../utils';
import { OrdemServicoFiltros, defaultFilters, type FiltersState } from '../components/OrdemServicoFiltros';
import { OrdemServicoFiltrosAtivos } from '../components/OrdemServicoFiltrosAtivos';

const dotBadge = (dotColorClass: string, label: string) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground">
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorClass}`} />
    {label}
  </span>
);

const getDurationMeta = (ordem: {
  status: string;
  dias_em_aberto: number | null;
  dias_entre_criacao_e_conclusao: number | null;
}) => {
  const isDone = ordem.status === 'concluida';
  return {
    label: isDone ? 'até conclusão' : 'em aberto',
    value: formatDaysCount(
      isDone ? ordem.dias_entre_criacao_e_conclusao : ordem.dias_em_aberto,
    ),
  };
};

const STATUS_SORT: Record<string, number> = { aberta: 0, em_andamento: 1, concluida: 2, cancelada: 3 };
const PRIORITY_SORT: Record<string, number> = { alta: 0, media: 1, baixa: 2 };

const OrdemServicoListPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [page, setPage] = useState(1);

  const { data: ordens = [], isLoading } = useOrdensLista();
  const { canViewOrderValues, canManageOrders } = useUserRole();

  const { data: usuarios = [] } = useUsers();
  const { data: servicosResumo = [], isLoading: loadingServicosResumo } = useServicosResumo();
  const { data: tarefasResumo = [], isLoading: loadingTarefasResumo } = useTarefasResumo();
  const loadingEquipe = loadingServicosResumo || loadingTarefasResumo;

  const technicianOptions = useMemo(
    () =>
      usuarios
        .filter((u) => u.tipo_usuario === 'tecnico' || u.tipo_usuario === 'sub_gestor_tecnico')
        .map((u) => ({ value: String(u.id), label: u.nome_completo || u.username })),
    [usuarios],
  );

  const servicosPorOrdem = useMemo(() => {
    const acc: Record<number, typeof servicosResumo> = {};
    servicosResumo.forEach((s) => {
      (acc[s.ordem_servico] ??= []).push(s);
    });
    return acc;
  }, [servicosResumo]);

  const servicoIdParaOrdem = useMemo(() => {
    const acc: Record<number, number> = {};
    servicosResumo.forEach((s) => { acc[s.id] = s.ordem_servico; });
    return acc;
  }, [servicosResumo]);

  const tecnicosPorOrdem = useMemo(() => {
    const acc: Record<number, Map<number, string>> = {};
    tarefasResumo.forEach((t) => {
      const ordemId = servicoIdParaOrdem[t.servico];
      if (ordemId === undefined) return;
      const map = acc[ordemId] ??= new Map();
      map.set(t.responsavel, t.responsavel_nome);
    });
    return acc;
  }, [tarefasResumo, servicoIdParaOrdem]);

  const filteredOrdens = ordens.filter((ordem) => {
    const q = filters.search.toLowerCase();
    const matchesText =
      !q ||
      (ordem.cliente_detail?.nome ?? '').toLowerCase().includes(q) ||
      String(ordem.id).includes(q) ||
      (servicosPorOrdem[ordem.id] ?? []).some((s) => (s.repositorio_nome ?? '').toLowerCase().includes(q));

    const matchesStatus   = filters.status.length === 0 || filters.status.includes(ordem.status);
    const matchesPriority = filters.priority.length === 0 || (!!ordem.prioridade && filters.priority.includes(ordem.prioridade));
    const matchesBilling  =
      filters.billing === 'all' ||
      (filters.billing === 'paid'     && ordem.faturada) ||
      (filters.billing === 'released' && !ordem.faturada && ordem.liberada_para_faturamento) ||
      (filters.billing === 'unpaid'   && !ordem.faturada && !ordem.liberada_para_faturamento);
    const matchesContract = !filters.contractOnly || ordem.contrato;
    const matchesTechnician =
      filters.technicianIds.length === 0 ||
      filters.technicianIds.some((tid) => tecnicosPorOrdem[ordem.id]?.has(Number(tid)));

    const created = new Date(ordem.data_criacao ?? ordem.criada_em);
    const start = filters.dateRange.from
      ? new Date(filters.dateRange.from.getFullYear(), filters.dateRange.from.getMonth(), filters.dateRange.from.getDate())
      : undefined;
    const end = filters.dateRange.to
      ? new Date(filters.dateRange.to.getFullYear(), filters.dateRange.to.getMonth(), filters.dateRange.to.getDate(), 23, 59, 59, 999)
      : undefined;
    const matchesDate = (!start || created >= start) && (!end || created <= end);

    return matchesText && matchesStatus && matchesPriority && matchesBilling && matchesContract && matchesDate && matchesTechnician;
  });

  const sortedOrdens = [...filteredOrdens].sort((a, b) => {
    const statusDiff = (STATUS_SORT[a.status] ?? 4) - (STATUS_SORT[b.status] ?? 4);
    if (statusDiff !== 0) return statusDiff;
    return (PRIORITY_SORT[a.prioridade ?? ''] ?? 3) - (PRIORITY_SORT[b.prioridade ?? ''] ?? 3);
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedOrdens.length / itemsPerPage);
  const paginatedOrdens = sortedOrdens.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => { setPage(1); }, [filters]);
  useEffect(() => {
    if (totalPages === 0) setPage(1);
    else if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
          <p className="text-muted-foreground">Gerencie todas as suas ordens de serviço</p>
        </div>
        {canManageOrders && (
          <Button variant="hero" onClick={() => navigate('/dashboard/orders/new')}>
            <Plus className="w-4 h-4" />
            Nova Ordem
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <OrdemServicoFiltros filters={filters} onChange={setFilters} technicianOptions={technicianOptions} />
        <OrdemServicoFiltrosAtivos filters={filters} onChange={setFilters} technicianOptions={technicianOptions} />
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3">Ordem de Serviço</TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[90px]">Prioridade</TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[90px]">Criação</TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[110px]">Tempo</TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[170px]">Equipe</TableHead>
                  {canViewOrderValues && (
                    <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[110px] text-right">Valor</TableHead>
                  )}
                  <TableHead className="py-2 px-3 w-[40px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading
                  ? Array.from({ length: 10 }).map((_, idx) => (
                      <TableRow key={`skeleton-${idx}`} className="border-border">
                        <TableCell className="py-3 px-3">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-3 w-28" />
                              <Skeleton className="h-3 w-14" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3"><Skeleton className="h-3 w-14" /></TableCell>
                        <TableCell className="py-3 px-3"><Skeleton className="h-3 w-20" /></TableCell>
                        <TableCell className="py-3 px-3"><Skeleton className="h-8 w-20" /></TableCell>
                        <TableCell className="py-3 px-3"><Skeleton className="h-6 w-28" /></TableCell>
                        {canViewOrderValues && <TableCell className="py-3 px-3"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>}
                        <TableCell className="py-3 px-3" />
                      </TableRow>
                    ))
                  : paginatedOrdens.map((ordem) => (
                      (() => {
                        const duration = getDurationMeta(ordem);

                        return (
                          <TableRow
                            key={ordem.id}
                            className="border-border hover:bg-muted/40 cursor-pointer transition-colors group"
                            onClick={() => navigate(`/dashboard/orders/${ordem.id}`)}
                          >
                            <TableCell className="py-3 px-3">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-semibold uppercase">{ordem.cliente_detail?.nome ?? '—'}</span>
                                  {ordem.contrato && (
                                    <span className="bg-blue-600 text-white rounded-sm text-[9px] font-bold px-1 py-0.5 tracking-widest">CTR</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5">
                                  {dotBadge(STATUS_DOT[ordem.status] ?? 'bg-muted-foreground', getStatusLabel(ordem.status))}
                                  {dotBadge(
                                    ordem.faturada ? 'bg-green-600' : ordem.liberada_para_faturamento ? 'bg-amber-500' : 'bg-muted-foreground',
                                    ordem.faturada ? 'Faturado' : ordem.liberada_para_faturamento ? 'Lib. faturamento' : 'Não faturado',
                                  )}
                                  <span className="font-mono text-[10px] text-muted-foreground">#{ordem.id}</span>
                                </div>
                                {(() => {
                                  if (loadingServicosResumo) {
                                    return <Skeleton className="mt-1.5 h-3 w-40" />;
                                  }
                                  const nomes = (servicosPorOrdem[ordem.id] ?? [])
                                    .map((s) => s.repositorio_nome)
                                    .filter((nome): nome is string => !!nome);
                                  if (nomes.length === 0) return null;
                                  const texto = nomes.join(', ');
                                  return (
                                    <p className="mt-1.5 max-w-[360px] truncate text-[11px] text-muted-foreground" title={texto}>
                                      {texto}
                                    </p>
                                  );
                                })()}
                              </div>
                            </TableCell>

                            <TableCell className="py-3 px-3">
                              {ordem.prioridade
                                ? dotBadge(PRIORITY_DOT[ordem.prioridade] ?? 'bg-muted-foreground', getPriorityLabel(ordem.prioridade))
                                : <span className="text-[11px] text-muted-foreground">—</span>
                              }
                            </TableCell>

                            <TableCell className="py-3 px-3">
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {formatDate(ordem.data_criacao ?? ordem.criada_em) ?? '—'}
                              </span>
                            </TableCell>

                            <TableCell className="py-3 px-3">
                              <div className="leading-tight">
                                <span className="text-xs font-semibold tabular-nums">
                                  {duration.value ?? '—'}
                                </span>
                                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                                  {duration.label}
                                </p>
                              </div>
                            </TableCell>

                            <TableCell className="py-3 px-3">
                              {loadingEquipe ? (
                                <Skeleton className="h-6 w-28" />
                              ) : (() => {
                                const tecnicos = Array.from(tecnicosPorOrdem[ordem.id]?.entries() ?? []);
                                const servicosCount = servicosPorOrdem[ordem.id]?.length ?? 0;
                                if (tecnicos.length === 0 && servicosCount === 0) {
                                  return <span className="text-[11px] text-muted-foreground">—</span>;
                                }
                                return (
                                  <div className="space-y-1">
                                    <div className="flex items-center -space-x-1.5">
                                      {tecnicos.slice(0, 3).map(([tid, nome]) => (
                                        <span
                                          key={tid}
                                          title={nome}
                                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold ${avatarColor(nome)}`}
                                        >
                                          {initials(nome)}
                                        </span>
                                      ))}
                                      {tecnicos.length > 3 && (
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground">
                                          +{tecnicos.length - 3}
                                        </span>
                                      )}
                                      {tecnicos.length === 0 && (
                                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                          <Users className="h-3 w-3" /> sem técnico
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                      {servicosCount} serviço{servicosCount !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                );
                              })()}
                            </TableCell>

                            {canViewOrderValues && (
                              <TableCell className="py-3 px-3 text-right">
                                <span className="text-sm font-semibold tabular-nums">{formatCurrency(ordem.valor)}</span>
                              </TableCell>
                            )}

                            <TableCell className="py-3 px-3">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/orders/${ordem.id}`); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                                title="Ver OS completa"
                              >
                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })()
                    ))
                }
              </TableBody>
            </Table>
          </div>

          <div className="px-3 flex items-center">
            <Separator className="flex-1" />
            {!isLoading && (
              <span className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                {filteredOrdens.length} {filteredOrdens.length === 1 ? 'ordem' : 'ordens'}
              </span>
            )}
          </div>

          {totalPages > 1 && (
            <div className="p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}
                      className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {(() => {
                    const items: (number | 'ellipsis')[] = [];
                    if (totalPages <= 7) {
                      for (let p = 1; p <= totalPages; p++) items.push(p);
                    } else {
                      items.push(1);
                      const left = Math.max(page - 1, 2);
                      const right = Math.min(page + 1, totalPages - 1);
                      if (left > 2) items.push('ellipsis');
                      for (let p = left; p <= right; p++) items.push(p);
                      if (right < totalPages - 1) items.push('ellipsis');
                      items.push(totalPages);
                    }
                    return items.map((it, idx) => (
                      <PaginationItem key={`${it}-${idx}`}>
                        {it === 'ellipsis'
                          ? <PaginationEllipsis />
                          : <PaginationLink href="#" isActive={it === page} onClick={(e) => { e.preventDefault(); setPage(it as number); }}>{it}</PaginationLink>
                        }
                      </PaginationItem>
                    ));
                  })()}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {!isLoading && filteredOrdens.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma ordem encontrada</h3>
              <p className="text-muted-foreground mb-4">Tente ajustar os filtros ou crie uma nova ordem</p>
              {canManageOrders && (
                <Link to="/dashboard/orders/new">
                  <Button variant="hero"><Plus className="w-4 h-4" />Nova Ordem</Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdemServicoListPage;
