import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor } from '@/data/mockData';
import { useServiceOrders, useDeleteServiceOrder } from '@/services/orders';
import { useUserRole } from '@/hooks/useUserRole';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const OrdersPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const { data: orders = [], isLoading } = useServiceOrders();
  const del = useDeleteServiceOrder();
  const { canViewOrderValues, canManageOrders } = useUserRole();

  const filteredOrders = orders.filter(order => {
    const matchesText = order.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const created = order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt);
    if (!dateRange.from && !dateRange.to) return matchesText;
    const start = dateRange.from ? new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate(), 0, 0, 0, 0) : undefined;
    const end = dateRange.to ? new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59, 999) : undefined;
    const inRange =
      (!start || created >= start) &&
      (!end || created <= end);
    return matchesText && inRange;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const ta = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
    const tb = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
    return tb - ta;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = sortedOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, dateRange]);

  useEffect(() => {
    if (totalPages === 0) {
      setPage(1);
    } else if (page > totalPages) {
      setPage(totalPages);
    }
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

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="uppercase">
                    {dateRange.from && dateRange.to
                      ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`
                      : dateRange.from
                        ? `${formatDate(dateRange.from)} - ...`
                        : 'Entre datas'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    showOutsideDays
                  />
                </PopoverContent>
              </Popover>
              {dateRange.from || dateRange.to ? (
                <Button variant="ghost" onClick={() => setDateRange({})} className="uppercase">
                  Limpar
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="uppercase">ID</TableHead>
                <TableHead className="uppercase">Cliente</TableHead>
                {canViewOrderValues && <TableHead className="uppercase">Valor</TableHead>}
                <TableHead className="uppercase w-40">Conclusão</TableHead>
                <TableHead className="uppercase w-40">Faturamento</TableHead>
                <TableHead className="hidden sm:table-cell uppercase">Criação</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, idx) => (
                    <TableRow key={`skeleton-${idx}`} className="border-border">
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><div className="space-y-1"><Skeleton className="h-4 w-40" /><div className="hidden sm:block"><Skeleton className="h-3 w-52" /></div></div></TableCell>
                      {canViewOrderValues && <TableCell><Skeleton className="h-4 w-20" /></TableCell>}
                      <TableCell className="w-48"><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                : paginatedOrders.map((order) => (
                    <TableRow key={order.id} className="border-border">
                      <TableCell><span className="font-medium uppercase">{order.id}</span></TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium uppercase">{order.clientName}</p>
                          <div className="hidden sm:flex items-center gap-1 mt-1 flex-wrap">
                            {order.priority && <Badge className={`${getPriorityColor(order.priority)} border-0 uppercase text-xs`}>{getPriorityLabel(order.priority)}</Badge>}
                            {order.isContract && <Badge className="bg-blue-600 text-white border-0 uppercase text-xs">Contrato</Badge>}
                          </div>
                        </div>
                      </TableCell>
                      {canViewOrderValues && <TableCell><span className="font-semibold">{formatCurrency(order.totalAmount)}</span></TableCell>}
                      <TableCell className="w-40"><Badge className={`${getStatusColor(order.status)} border-0 uppercase`}>{getStatusLabel(order.status)}</Badge></TableCell>
                      <TableCell className="w-40"><Badge className={`border-0 uppercase ${order.isPaid ? 'bg-green-600 text-white' : order.liberadaParaFaturamento ? 'bg-amber-500 text-white' : 'bg-muted text-foreground'}`}>{order.isPaid ? 'Faturado' : order.liberadaParaFaturamento ? 'Liberado' : 'Não faturado'}</Badge></TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        {canManageOrders ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/orders/${order.id}/edit`)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  const ok = window.confirm('Deseja excluir esta ordem?');
                                  if (!ok) return;
                                  del.mutate(String(order.id));
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          <div className="px-4"><Separator /></div>

          {totalPages > 1 && (
            <div className="p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }} className={page === 1 ? 'pointer-events-none opacity-50' : ''} />
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
                        {it === 'ellipsis' ? <PaginationEllipsis /> : <PaginationLink href="#" isActive={it === page} onClick={(e) => { e.preventDefault(); setPage(it as number); }}>{it as number}</PaginationLink>}
                      </PaginationItem>
                    ));
                  })()}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} />
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
