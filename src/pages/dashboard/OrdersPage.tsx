import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, getStatusLabel, getPriorityLabel } from '@/data/mockData';
import { useServiceOrders } from '@/services/orders';
import { useUserRole } from '@/hooks/useUserRole';
import { ServiceStatus } from '@/types';
import OrderFilters, { FiltersState, defaultFilters } from '@/components/orders/OrderFilters';
import ActiveFilterChips from '@/components/orders/ActiveFilterChips';

const STATUS_DOT: Record<ServiceStatus, string> = {
  pending:     'bg-status-pending',
  in_progress: 'bg-status-progress',
  completed:   'bg-status-completed',
  cancelled:   'bg-status-cancelled',
};

const PRIORITY_DOT: Record<string, string> = {
  baixa: 'bg-muted-foreground',
  media: 'bg-yellow-500',
  alta:  'bg-red-600',
};

const dotBadge = (dotColorClass: string, label: string) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground">
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorClass}`} />
    {label}
  </span>
);

const OrdersPage = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [page, setPage] = useState(1);
  const { data: orders = [], isLoading } = useServiceOrders();
  const { canViewOrderValues, canManageOrders } = useUserRole();

  const filteredOrders = orders.filter(order => {
    const q = filters.search.toLowerCase();
    const matchesText = !q ||
      order.clientName.toLowerCase().includes(q) ||
      order.id.toLowerCase().includes(q);

    const matchesStatus   = filters.status.length === 0 || filters.status.includes(order.status);
    const matchesPriority = filters.priority.length === 0 || (!!order.priority && filters.priority.includes(order.priority));
    const matchesBilling  =
      filters.billing === 'all' ||
      (filters.billing === 'paid'     && order.isPaid) ||
      (filters.billing === 'released' && !order.isPaid && !!order.liberadaParaFaturamento) ||
      (filters.billing === 'unpaid'   && !order.isPaid && !order.liberadaParaFaturamento);
    const matchesContract = !filters.contractOnly || !!order.isContract;

    const created = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
    const start = filters.dateRange.from
      ? new Date(filters.dateRange.from.getFullYear(), filters.dateRange.from.getMonth(), filters.dateRange.from.getDate())
      : undefined;
    const end = filters.dateRange.to
      ? new Date(filters.dateRange.to.getFullYear(), filters.dateRange.to.getMonth(), filters.dateRange.to.getDate(), 23, 59, 59, 999)
      : undefined;
    const matchesDate = (!start || created >= start) && (!end || created <= end);

    return matchesText && matchesStatus && matchesPriority && matchesBilling && matchesContract && matchesDate;
  });

  const STATUS_ORDER: Record<string, number> = { pending: 0, in_progress: 1, completed: 2, cancelled: 3 };
  const PRIORITY_ORDER: Record<string, number> = { alta: 0, media: 1, baixa: 2 };

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const statusDiff = (STATUS_ORDER[a.status] ?? 4) - (STATUS_ORDER[b.status] ?? 4);
    if (statusDiff !== 0) return statusDiff;

    const da = a.dueDate ? (a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate)).getTime() : Infinity;
    const db = b.dueDate ? (b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate)).getTime() : Infinity;
    if (da !== db) return da - db;

    return (PRIORITY_ORDER[a.priority ?? ''] ?? 3) - (PRIORITY_ORDER[b.priority ?? ''] ?? 3);
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = sortedOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => { setPage(1); }, [filters]);

  useEffect(() => {
    if (totalPages === 0) setPage(1);
    else if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

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
        <OrderFilters filters={filters} onChange={setFilters} />
        <ActiveFilterChips filters={filters} onChange={setFilters} />
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-y-auto max-h-[calc(100vh-320px)]">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3">Ordem de Serviço</TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[90px]">Prioridade</TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[90px]">Prazo</TableHead>
                  {canViewOrderValues && (
                    <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[110px] text-right">Valor</TableHead>
                  )}
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[90px]">Criação</TableHead>
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
                        {canViewOrderValues && <TableCell className="py-3 px-3"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>}
                        <TableCell className="py-3 px-3"><Skeleton className="h-3 w-20" /></TableCell>
                      </TableRow>
                    ))
                  : paginatedOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="border-border hover:bg-muted/40 cursor-pointer transition-colors"
                        onClick={() => navigate(`/dashboard/orders/${order.id}/edit`)}
                      >
                        <TableCell className="py-3 px-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold uppercase">{order.clientName}</span>
                              {order.isContract && (
                                <span className="bg-blue-600 text-white rounded-sm text-[9px] font-bold px-1 py-0.5 tracking-widest">CTR</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                              {dotBadge(STATUS_DOT[order.status], getStatusLabel(order.status))}
                              {dotBadge(
                                order.isPaid ? 'bg-green-600' : order.liberadaParaFaturamento ? 'bg-amber-500' : 'bg-muted-foreground',
                                order.isPaid ? 'Faturado' : order.liberadaParaFaturamento ? 'Lib. faturamento' : 'Não faturado'
                              )}
                              <span className="font-mono text-[10px] text-muted-foreground">#{order.id}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          {order.priority
                            ? dotBadge(PRIORITY_DOT[order.priority], getPriorityLabel(order.priority))
                            : <span className="text-[11px] text-muted-foreground">—</span>
                          }
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          {order.dueDate
                            ? <span className="text-xs tabular-nums">{formatDate(order.dueDate)}</span>
                            : <span className="text-[11px] text-muted-foreground">—</span>
                          }
                        </TableCell>
                        {canViewOrderValues && (
                          <TableCell className="py-3 px-3 text-right">
                            <span className="text-sm font-semibold tabular-nums">{formatCurrency(order.totalAmount)}</span>
                          </TableCell>
                        )}
                        <TableCell className="py-3 px-3">
                          <span className="text-xs text-muted-foreground tabular-nums">{formatDate(order.createdAt)}</span>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>

          <div className="px-3 flex items-center">
            <Separator className="flex-1" />
            {!isLoading && (
              <span className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'ordem' : 'ordens'}
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
                    const siblingCount = 1;
                    const items: (number | 'ellipsis')[] = [];
                    if (totalPages <= 7) {
                      for (let p = 1; p <= totalPages; p++) items.push(p);
                    } else {
                      items.push(1);
                      const left = Math.max(page - siblingCount, 2);
                      const right = Math.min(page + siblingCount, totalPages - 1);
                      if (left > 2) items.push('ellipsis');
                      for (let p = left; p <= right; p++) items.push(p);
                      if (right < totalPages - 1) items.push('ellipsis');
                      items.push(totalPages);
                    }
                    return items.map((it, idx) => (
                      <PaginationItem key={`${it}-${idx}`}>
                        {it === 'ellipsis'
                          ? <PaginationEllipsis />
                          : <PaginationLink href="#" isActive={it === page} onClick={(e) => { e.preventDefault(); setPage(it as number); }}>{it as number}</PaginationLink>
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

          {!isLoading && filteredOrders.length === 0 && (
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

export default OrdersPage;
