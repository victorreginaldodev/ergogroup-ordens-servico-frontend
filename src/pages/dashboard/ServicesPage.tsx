import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { getStatusColor, getStatusLabel } from '@/data/mockData';
import { useServiceListPage } from '@/services/serviceList';
import { ServiceStatus } from '@/types';
import { useUserRole } from '@/hooks/useUserRole';

const ServicesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tasksFilter, setTasksFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useServiceListPage({
    page,
    pageSize: 20,
    q: searchTerm || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    hasTasks:
      tasksFilter === 'with_tasks'
        ? 'true'
        : tasksFilter === 'without_tasks'
          ? 'false'
          : undefined,
  });
  const { canManageServices } = useUserRole();

  const items = (data?.items ?? []).map((item) => {
    let status: ServiceStatus = 'pending';
    const raw = (item.status || '').toLowerCase();
    if (raw === 'em_andamento') status = 'in_progress';
    else if (raw === 'concluida' || raw === 'concluido') status = 'completed';

    return {
      id: String(item.id),
      serviceName: String(item.servico_catalogo_nome ?? ''),
      status,
      orderId: String(item.ordem_servico ?? ''),
      clientName: item.cliente_nome ?? '',
      tem_tarefas: item.tem_tarefas,
    };
  });

  const totalPages = data?.totalPages ?? 1;

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, tasksFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (error) {
    return <div className="text-destructive">Falha ao carregar serviços.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Gerencie seu catálogo de serviços</p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex w-full items-center gap-3">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por serviço ou cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-secondary border-border uppercase"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[220px] bg-secondary border-border">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Não iniciado</SelectItem>
                    <SelectItem value="in_progress">Em andamento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tasksFilter} onValueChange={setTasksFilter}>
                  <SelectTrigger className="w-[220px] bg-secondary border-border">
                    <SelectValue placeholder="Tarefas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as tarefas</SelectItem>
                    <SelectItem value="with_tasks">Com tarefas</SelectItem>
                    <SelectItem value="without_tasks">Sem tarefas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="uppercase w-12">OS</TableHead>
                <TableHead className="uppercase w-72">Cliente</TableHead>
                <TableHead className="uppercase w-56">Repositório</TableHead>
                <TableHead className="w-48 uppercase">Status</TableHead>
                <TableHead className="w-24 uppercase text-center">Tarefas</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, idx) => (
                    <TableRow key={`skeleton-${idx}`} className="border-border">
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                : items.map((item) => (
                    <TableRow key={item.id} className="border-border">
                      <TableCell className="font-medium uppercase w-12">{item.orderId}</TableCell>
                      <TableCell className="text-muted-foreground uppercase">{item.clientName}</TableCell>
                      <TableCell className="font-semibold uppercase">{item.serviceName}</TableCell>
                      <TableCell className="w-48">
                        <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap inline-flex uppercase ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.tem_tarefas ? (
                          <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">Sim</span>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded uppercase">Não</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {canManageServices ? (
                          <Button asChild variant="ghost" className="h-8 px-2" aria-label="Gerenciar serviço">
                            <Link to={`/dashboard/services/manage/${item.orderId || ''}/${item.id}`} className="flex items-center">
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="ghost" className="h-8 px-2" disabled aria-label="Gerenciar serviço">
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum serviço encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="px-4">
            <Separator />
          </div>
          {totalPages > 1 && (
            <div className="p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {(() => {
                    const siblingCount = 1;
                    const pages: (number | 'ellipsis')[] = [];
                    if (totalPages <= 7) {
                      for (let p = 1; p <= totalPages; p++) pages.push(p);
                    } else {
                      pages.push(1);
                      const left = Math.max(page - siblingCount, 2);
                      const right = Math.min(page + siblingCount, totalPages - 1);
                      if (left > 2) pages.push('ellipsis');
                      for (let p = left; p <= right; p++) pages.push(p);
                      if (right < totalPages - 1) pages.push('ellipsis');
                      pages.push(totalPages);
                    }
                    return pages.map((it, idx) => (
                      <PaginationItem key={`${it}-${idx}`}>
                        {it === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            isActive={it === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(it as number);
                            }}
                          >
                            {it as number}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ));
                  })()}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages) setPage(page + 1);
                      }}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicesPage;
