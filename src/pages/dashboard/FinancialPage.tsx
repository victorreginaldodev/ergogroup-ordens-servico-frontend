import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Lock, PencilLine, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { formatCurrency } from '@/data/mockData';
import { useBillingKpis, useBillingServiceOrdersPage, useMiniOsDetail, useMiniOsPage, useUpdateMiniOs } from '@/services/billing';
import { useServiceOrder, useUpdateServiceOrderBilling } from '@/services/orders';
import { useUserRole } from '@/hooks/useUserRole';

const PAGE_SIZE = 20;

const FinancialPage = () => {
  const navigate = useNavigate();
  const {
    data: kpis,
    isLoading: isKpiLoading,
    isError: isKpiError,
  } = useBillingKpis();
  const [miniOsSearch, setMiniOsSearch] = useState('');
  const [miniOsBillingFilter, setMiniOsBillingFilter] = useState<'all' | 'faturada' | 'nao_faturada'>('all');
  const [isMiniDialogOpen, setIsMiniDialogOpen] = useState(false);
  const [selectedMiniId, setSelectedMiniId] = useState<number | null>(null);
  const [miniBillingValue, setMiniBillingValue] = useState<'sim' | 'nao' | ''>('');
  const [miniNfNumber, setMiniNfNumber] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [faturamentoValue, setFaturamentoValue] = useState<'sim' | 'nao' | ''>('');
  const [billingDate, setBillingDate] = useState('');
  const [nfNumber, setNfNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'concluida' | 'andamento'>('all');
  const [billingFilter, setBillingFilter] = useState<'all' | 'faturada' | 'nao_faturada'>('all');
  const [activeView, setActiveView] = useState<'os' | 'minios'>('os');
  const [ordersPage, setOrdersPage] = useState(1);
  const [miniPage, setMiniPage] = useState(1);
  const {
    data: ordersPageData,
    isLoading,
    isError,
  } = useBillingServiceOrdersPage({
    page: ordersPage,
    pageSize: PAGE_SIZE,
    q: searchTerm,
    status: statusFilter,
    billing: billingFilter,
  });
  const orders = ordersPageData?.items ?? [];
  const ordersTotalPages = ordersPageData?.totalPages ?? 1;
  const {
    data: miniOsPageData,
    isLoading: isMiniOsLoading,
    isError: isMiniOsError,
  } = useMiniOsPage({
    page: miniPage,
    pageSize: PAGE_SIZE,
    q: miniOsSearch,
    billing: miniOsBillingFilter,
  });
  const miniOs = miniOsPageData?.items ?? [];
  const miniOsTotalPages = miniOsPageData?.totalPages ?? 1;

  const selectedOrderIdString = selectedOrderId ? String(selectedOrderId) : undefined;
  const {
    data: orderDetail,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useServiceOrder(selectedOrderIdString);
  const updateServiceOrderBilling = useUpdateServiceOrderBilling();
  const {
    data: miniDetail,
    isLoading: isMiniDetailLoading,
    isError: isMiniDetailError,
  } = useMiniOsDetail(selectedMiniId ?? undefined);
  const updateMiniOs = useUpdateMiniOs();
  const { canAccessFinancials } = useUserRole();

  const renderBadge = (condition: boolean, positive: string, negative: string) => (
    <Badge className={condition ? 'bg-status-completed text-primary-foreground' : 'bg-status-pending text-primary-foreground'}>
      {condition ? positive : negative}
    </Badge>
  );

  useEffect(() => {
    setOrdersPage(1);
  }, [searchTerm, statusFilter, billingFilter]);

  useEffect(() => {
    setMiniPage(1);
  }, [miniOsSearch, miniOsBillingFilter]);

  useEffect(() => {
    if (ordersPage > ordersTotalPages) {
      setOrdersPage(ordersTotalPages);
    }
  }, [ordersPage, ordersTotalPages]);

  useEffect(() => {
    if (miniPage > miniOsTotalPages) {
      setMiniPage(miniOsTotalPages);
    }
  }, [miniPage, miniOsTotalPages]);

  useEffect(() => {
    if (!orderDetail) {
      setFaturamentoValue('');
      setBillingDate('');
      setNfNumber('');
      return;
    }
    const faturamentoRaw = (orderDetail.faturamento ?? '').toLowerCase();
    if (faturamentoRaw === 'sim' || faturamentoRaw === 'nao') {
      setFaturamentoValue(faturamentoRaw);
    } else {
      setFaturamentoValue('');
    }
    setBillingDate(orderDetail.data_faturamento ?? '');
    const numeroNf = orderDetail.numero_nf;
    setNfNumber(numeroNf !== null && numeroNf !== undefined ? String(numeroNf) : '');
  }, [orderDetail]);

  useEffect(() => {
    if (!miniDetail) {
      setMiniBillingValue('');
      setMiniNfNumber('');
      return;
    }
    const faturamentoRaw = (miniDetail.faturamento ?? '').toLowerCase();
    if (faturamentoRaw === 'sim' || faturamentoRaw === 'nao') {
      setMiniBillingValue(faturamentoRaw);
    } else {
      setMiniBillingValue('');
    }
    setMiniNfNumber(miniDetail.n_nf ?? '');
  }, [miniDetail]);

  const handleEditClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedOrderId(null);
      setFaturamentoValue('');
      setBillingDate('');
      setNfNumber('');
    }
  };

  const handleMiniEditClick = (miniId: number) => {
    setSelectedMiniId(miniId);
    setIsMiniDialogOpen(true);
  };

  const handleMiniDialogChange = (open: boolean) => {
    setIsMiniDialogOpen(open);
    if (!open) {
      setSelectedMiniId(null);
      setMiniBillingValue('');
      setMiniNfNumber('');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOrderId) return;

    try {
      await updateServiceOrderBilling.mutateAsync({
        id: selectedOrderId,
        payload: {
          faturamento: faturamentoValue || null,
          data_faturamento: billingDate || null,
          numero_nf: nfNumber ? Number(nfNumber) : null,
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar ordem de serviço para faturamento', error);
    }
  };

  const handleMiniSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMiniId) return;

    try {
      await updateMiniOs.mutateAsync({
        id: selectedMiniId,
        payload: {
          faturamento: miniBillingValue || null,
          n_nf: miniNfNumber || null,
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar Mini OS', error);
    }
  };

  const renderPager = (page: number, totalPages: number, setPage: (value: number) => void) => {
    if (totalPages <= 1) return null;

    const siblingCount = 1;
    const items: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let p = 1; p <= totalPages; p++) items.push(p);
    } else {
      items.push(1);
      const start = Math.max(2, page - siblingCount);
      const end = Math.min(totalPages - 1, page + siblingCount);
      if (start > 2) items.push('ellipsis');
      for (let p = start; p <= end; p++) items.push(p);
      if (end < totalPages - 1) items.push('ellipsis');
      items.push(totalPages);
    }

    return (
      <div className="pt-4">
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
            {items.map((item, idx) => (
              <PaginationItem key={`${item}-${idx}`}>
                {item === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={item === page}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(item);
                    }}
                  >
                    {item}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
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
    );
  };

  if (!canAccessFinancials) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Lock className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="mt-4 text-xl">Acesso restrito</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Seu perfil não possui permissão para visualizar as informações financeiras.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Ordens de serviço disponíveis para faturamento</p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold">Financeiro</CardTitle>
            <div className="inline-flex rounded-md border border-border bg-muted p-1">
              <Button
                type="button"
                variant={activeView === 'os' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('os')}
                className="rounded-sm px-4"
              >
                Ordens
              </Button>
              <Button
                type="button"
                variant={activeView === 'minios' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('minios')}
                className="rounded-sm px-4"
              >
                Tarefas rápidas
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isKpiLoading && (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card key={`kpi-loading-${index}`} className="border-border bg-secondary/40">
                    <CardContent className="space-y-3 p-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {!isKpiLoading && isKpiError && (
              <Card className="border-destructive bg-destructive/10 sm:col-span-2 lg:col-span-3">
                <CardContent className="p-4 text-destructive">
                  Não foi possível carregar os indicadores de faturamento.
                </CardContent>
              </Card>
            )}

            {!isKpiLoading && !isKpiError && kpis && (
              <>
                <Card className="border-border bg-secondary/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      Total faturado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-2xl font-bold">{formatCurrency(kpis.total_faturado ?? 0)}</p>
                  </CardContent>
                </Card>

                <Card className="border-border bg-secondary/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      Total para faturar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-2xl font-bold">{formatCurrency(kpis.total_para_faturar ?? 0)}</p>
                  </CardContent>
                </Card>

                <Card className="border-border bg-secondary/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">
                      Sem liberação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-2xl font-bold">{formatCurrency(kpis.total_sem_liberacao ?? 0)}</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {activeView === 'os' ? (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente ou número da OS..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Status (todos)</SelectItem>
                      <SelectItem value="concluida">Concluídas</SelectItem>
                      <SelectItem value="andamento">Em andamento</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={billingFilter}
                    onValueChange={(value) => setBillingFilter(value as typeof billingFilter)}
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Faturamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Faturamento (todos)</SelectItem>
                      <SelectItem value="faturada">Faturadas</SelectItem>
                      <SelectItem value="nao_faturada">Não faturadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="uppercase">OS</TableHead>
                    <TableHead className="uppercase">Cliente</TableHead>
                    <TableHead className="uppercase text-center w-48">Status</TableHead>
                    <TableHead className="uppercase text-center">Faturamento</TableHead>
                    <TableHead className="uppercase text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow className="border-border">
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Carregando ordens de serviço...
                      </TableCell>
                    </TableRow>
                  )}

                  {isError && !isLoading && (
                    <TableRow className="border-border">
                      <TableCell colSpan={5} className="py-8 text-center text-destructive">
                        Não foi possível carregar as ordens de serviço para faturamento.
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoading && !isError && orders.length === 0 && (
                    <TableRow className="border-border">
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Nenhuma ordem de serviço disponível para faturamento.
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoading && !isError && orders.map((order) => {
                    const concluded = (order.concluida ?? '').toLowerCase() === 'sim';
                    const billed = (order.faturamento ?? '').toLowerCase() === 'sim';

                    return (
                      <TableRow key={order.id} className="border-border">
                        <TableCell className="font-semibold text-muted-foreground">#{order.numero_os}</TableCell>
                        <TableCell className="font-medium">{order.cliente_nome}</TableCell>
                        <TableCell className="text-center">
                          {renderBadge(concluded, 'Concluída', 'Em andamento')}
                        </TableCell>
                        <TableCell className="text-center">
                          {renderBadge(billed, 'Faturada', 'Não faturada')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(order.id)}
                            >
                              <PencilLine className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/dashboard/orders/${order.id}/edit`)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {renderPager(ordersPage, ordersTotalPages, setOrdersPage)}
            </>
          ) : (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente ou ID..."
                    value={miniOsSearch}
                    onChange={(event) => setMiniOsSearch(event.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Select
                    value={miniOsBillingFilter}
                    onValueChange={(value) =>
                      setMiniOsBillingFilter(value as typeof miniOsBillingFilter)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Faturamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Faturamento (todos)</SelectItem>
                      <SelectItem value="faturada">Faturadas</SelectItem>
                      <SelectItem value="nao_faturada">Não faturadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-24 uppercase">ID</TableHead>
                    <TableHead className="uppercase">Cliente</TableHead>
                    <TableHead className="uppercase text-center">Faturamento</TableHead>
                    <TableHead className="uppercase text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isMiniOsLoading && (
                    <TableRow className="border-border">
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Carregando tarefas rápidas...
                      </TableCell>
                    </TableRow>
                  )}

                  {isMiniOsError && !isMiniOsLoading && (
                    <TableRow className="border-border">
                      <TableCell colSpan={4} className="py-8 text-center text-destructive">
                        Não foi possível carregar as tarefas rápidas.
                      </TableCell>
                    </TableRow>
                  )}

                  {!isMiniOsLoading && !isMiniOsError && miniOs.length === 0 && (
                    <TableRow className="border-border">
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Nenhuma mini OS encontrada.
                      </TableCell>
                    </TableRow>
                  )}

                  {!isMiniOsLoading && !isMiniOsError && miniOs.map((mini) => {
                    const billed = (mini.faturamento ?? '').toLowerCase() === 'sim';
                    return (
                      <TableRow key={mini.id} className="border-border">
                        <TableCell className="font-semibold text-muted-foreground">#{mini.id}</TableCell>
                        <TableCell className="font-medium">
                          {mini.cliente?.nome ?? 'Cliente não informado'}
                        </TableCell>
                        <TableCell className="text-center">
                          {renderBadge(billed, 'Faturada', 'Não faturada')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMiniEditClick(mini.id)}
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {renderPager(miniPage, miniOsTotalPages, setMiniPage)}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da ordem de serviço</DialogTitle>
          </DialogHeader>

          {isDetailLoading && (
            <div className="py-6 text-center text-muted-foreground">
              Carregando detalhes da ordem de serviço...
            </div>
          )}

          {isDetailError && !isDetailLoading && (
            <div className="py-6 text-center text-destructive">
              Não foi possível carregar os detalhes da ordem de serviço.
            </div>
          )}

          {!isDetailLoading && !isDetailError && orderDetail && (
            <div className="space-y-6 pb-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Cliente</h3>
                <p className="text-lg font-bold">{orderDetail.cliente?.nome ?? 'Cliente não informado'}</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground">Informações financeiras</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <span className="text-xs text-muted-foreground">Valor</span>
                    <p className="text-base font-medium">{formatCurrency(orderDetail.valor ?? 0)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <span className="text-xs text-muted-foreground">Forma de pagamento</span>
                    <p className="text-base font-medium capitalize">{orderDetail.forma_pagamento ?? '-'}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <span className="text-xs text-muted-foreground">Parcelas</span>
                    <p className="text-base font-medium">{orderDetail.quantidade_parcelas ?? 0}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <span className="text-xs text-muted-foreground">Cobrança imediata</span>
                    <p className="text-base font-medium">
                      {(orderDetail.cobranca_imediata ?? '').toLowerCase() === 'sim' ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4 sm:col-span-2">
                    <span className="text-xs text-muted-foreground">Primeiro faturamento</span>
                    <p className="text-base font-medium">{orderDetail.faturamento_1 ?? '-'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground">Contato para envio da NF</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <span className="text-xs text-muted-foreground">Nome</span>
                    <p className="text-base font-medium">{orderDetail.nome_contato_envio_nf ?? '-'}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <span className="text-xs text-muted-foreground">Contato</span>
                    <p className="text-base font-medium break-words">{orderDetail.contato_envio_nf ?? '-'}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground">Observação</h4>
                <p className="rounded-lg bg-secondary/50 p-4 text-sm text-muted-foreground">
                  {orderDetail.observacao?.trim() || 'Nenhuma observação registrada.'}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground">Serviços</h4>
                <div className="rounded-lg bg-secondary/50 p-4">
                  {orderDetail.servicos?.length ? (
                    <ul className="list-disc space-y-1 pl-4 text-sm">
                      {orderDetail.servicos.map((svc) => (
                        <li key={svc.id}>{svc.repositorio?.nome ?? 'Serviço sem nome'}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum serviço associado à ordem.</p>
                  )}
                </div>
              </div>

              <Separator />

              <form onSubmit={handleSubmit} className="space-y-4">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground">Atualizar faturamento</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="faturamento">Faturamento</Label>
                    <Select
                      value={faturamentoValue}
                      onValueChange={(value) => setFaturamentoValue(value as 'sim' | 'nao')}
                      disabled={updateServiceOrderBilling.isPending}
                    >
                      <SelectTrigger id="faturamento">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data-faturamento">Data do faturamento</Label>
                    <Input
                      id="data-faturamento"
                      type="date"
                      value={billingDate}
                      onChange={(event) => setBillingDate(event.target.value)}
                      disabled={updateServiceOrderBilling.isPending}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero-nf">Número da NF</Label>
                    <Input
                      id="numero-nf"
                      type="number"
                      value={nfNumber}
                      onChange={(event) => setNfNumber(event.target.value)}
                      disabled={updateServiceOrderBilling.isPending}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={updateServiceOrderBilling.isPending}>
                    {updateServiceOrderBilling.isPending ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isMiniDialogOpen} onOpenChange={handleMiniDialogChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da tarefa rápida</DialogTitle>
          </DialogHeader>

          {isMiniDetailLoading && (
            <div className="py-6 text-center text-muted-foreground">
              Carregando detalhes da tarefa rápida...
            </div>
          )}

          {isMiniDetailError && !isMiniDetailLoading && (
            <div className="py-6 text-center text-destructive">
              Não foi possível carregar os detalhes da tarefa rápida.
            </div>
          )}

          {!isMiniDetailLoading && !isMiniDetailError && miniDetail && (
            <div className="space-y-6 pb-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Cliente</h3>
                <p className="text-lg font-bold">
                  {miniDetail.cliente?.nome ?? 'Cliente não informado'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <span className="text-xs text-muted-foreground">Quantidade</span>
                  <p className="text-base font-medium">{miniDetail.quantidade ?? '-'}</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <div className="mt-1">
                    {renderBadge(
                      (miniDetail.status ?? '').toLowerCase() === 'finalizada',
                      'Finalizada',
                      miniDetail.status ?? 'Em andamento',
                    )}
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <span className="text-xs text-muted-foreground">NF atual</span>
                  <p className="text-base font-medium">{miniDetail.n_nf ?? '-'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <span className="text-xs text-muted-foreground">Data de início</span>
                  <p className="text-base font-medium">{miniDetail.data_inicio ?? '-'}</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <span className="text-xs text-muted-foreground">Data de término</span>
                  <p className="text-base font-medium">{miniDetail.data_termino ?? '-'}</p>
                </div>
              </div>

              <div className="rounded-lg bg-secondary/50 p-4">
                <span className="text-xs text-muted-foreground">Serviço</span>
                <p className="text-base font-medium">{miniDetail.servico?.nome ?? '-'}</p>
              </div>

              <div className="rounded-lg bg-secondary/50 p-4">
                <span className="text-xs text-muted-foreground">Descrição</span>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {miniDetail.descricao?.trim() || 'Sem descrição.'}
                </p>
              </div>

              <div className="rounded-lg bg-secondary/50 p-4">
                <span className="text-xs text-muted-foreground">Responsável</span>
                <p className="text-base font-medium">
                  {miniDetail.profile?.username ?? 'Não informado'}
                </p>
              </div>

              <form onSubmit={handleMiniSubmit} className="space-y-4">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground">
                  Atualizar faturamento
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mini-faturamento">Faturamento</Label>
                    <Select
                      value={miniBillingValue}
                      onValueChange={(value) => setMiniBillingValue(value as 'sim' | 'nao')}
                      disabled={updateMiniOs.isPending}
                    >
                      <SelectTrigger id="mini-faturamento">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mini-nf">Número da NF</Label>
                    <Input
                      id="mini-nf"
                      value={miniNfNumber}
                      onChange={(event) => setMiniNfNumber(event.target.value)}
                      placeholder="Ex.: 12345"
                      disabled={updateMiniOs.isPending}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={updateMiniOs.isPending}>
                    {updateMiniOs.isPending ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialPage;
