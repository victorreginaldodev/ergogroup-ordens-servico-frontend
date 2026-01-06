import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/data/mockData';
import { useServiceOrders, useDeleteServiceOrder } from '@/services/orders';
import { useClients } from '@/services/clients';
import { ServiceStatus } from '@/types';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';

const OrdersPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const { data: orders = [], isLoading } = useServiceOrders();
  const { data: clients = [] } = useClients();
  const del = useDeleteServiceOrder();
  const { canManageFinancials, isRestricted } = useUserRole();

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || id;

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      getClientName(order.clientName).toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
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
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (totalPages === 0) {
      setPage(1);
    } else if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
          <p className="text-muted-foreground">Gerencie todas as suas ordens de serviço</p>
        </div>
        <Button 
          variant="hero"
          onClick={() => {
            if (isRestricted) {
              toast({
                title: "Acesso negado",
                description: "Você não tem permissão para criar ordens.",
                variant: "destructive",
              });
            } else {
              navigate('/dashboard/orders/new');
            }
          }}
        >
          <Plus className="w-4 h-4" />
          Nova Ordem
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou número da ordem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-secondary border-border">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="uppercase">Ordem</TableHead>
                <TableHead className="uppercase">Cliente</TableHead>
                {canManageFinancials && <TableHead className="uppercase">Valor</TableHead>}
                <TableHead className="uppercase w-48">Status</TableHead>
                <TableHead className="hidden sm:table-cell uppercase">Criação</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, idx) => (
                    <TableRow key={`skeleton-${idx}`} className="border-border">
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-40" />
                          <div className="hidden sm:block">
                            <Skeleton className="h-3 w-52" />
                          </div>
                        </div>
                      </TableCell>
                      {canManageFinancials && (
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      )}
                      <TableCell className="w-48">
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                : paginatedOrders.map((order) => (
                    <TableRow key={order.id} className="border-border">
                      <TableCell>
                        <span className="font-medium uppercase">{order.orderNumber}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium uppercase">{getClientName(order.clientName)}</p>
                          <p className="text-sm text-muted-foreground hidden sm:block">{order.clientEmail}</p>
                        </div>
                      </TableCell>
                      {canManageFinancials && (
                        <TableCell>
                          <span className="font-semibold">{formatCurrency(order.totalAmount)}</span>
                        </TableCell>
                      )}
                      <TableCell className="w-48">
                        <Badge className={`${getStatusColor(order.status)} border-0 uppercase`}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                if (isRestricted) {
                                  e.preventDefault();
                                  toast({
                                    title: "Acesso negado",
                                    description: "Você não tem permissão para editar ordens.",
                                    variant: "destructive",
                                  });
                                } else {
                                  navigate(`/dashboard/orders/${order.id}/edit`);
                                }
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                if (isRestricted) {
                                  toast({
                                    title: "Acesso negado",
                                    description: "Você não tem permissão para excluir ordens.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
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
                      </TableCell>
                    </TableRow>
                  ))}
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

          {!isLoading && filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma ordem encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou crie uma nova ordem
              </p>
              <Link to="/dashboard/orders/new">
                <Button variant="hero">
                  <Plus className="w-4 h-4" />
                  Nova Ordem
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;
