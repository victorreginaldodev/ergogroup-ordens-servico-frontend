import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  History,
  Lock,
  MoreHorizontal,
  Receipt,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { OrdemAuditoriaTimeline } from '@/features/ordens/components/OrdemAuditoriaTimeline';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { MoneyValue } from '@/components/common/MoneyValue';
import { formatCurrency, formatDate } from '@/data/mockData';
import {
  useBillingKpis,
  useBillingServiceOrdersPage,
  useMiniOsDetail,
  useMiniOsPage,
  useUpdateMiniOs,
} from '@/services/billing';
import { useServiceOrder, useUpdateServiceOrderBilling } from '@/services/orders';
import { useUserRole } from '@/hooks/useUserRole';

const PAGE_SIZE = 20;

// ── Dot badge helper (same pattern as OS listing) ────────────────────────────
const dotBadge = (colorClass: string, label: string) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground">
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colorClass}`} />
    {label}
  </span>
);

// ── Pill filter (radio-style) ─────────────────────────────────────────────────
type PillOption<T extends string> = { value: T; label: string };
function PillFilter<T extends string>({
  options,
  value,
  onChange,
}: {
  options: PillOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
            value === opt.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-secondary text-muted-foreground border-border hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  iconColor,
  barColor,
  pct,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  barColor: string;
  pct: number;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">
              {label}
            </p>
            <p className="mt-0.5 text-lg font-bold tabular-nums leading-tight"><MoneyValue value={value} formatter={formatCurrency} /></p>
          </div>
          <span className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md', iconColor)}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="mt-2.5 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">{pct.toFixed(0)}% do total</p>
      </CardContent>
    </Card>
  );
}

// Usa slicing de string — não chama new Date(), não crasha com datetimes ────────
const safeFormatDate = (s: string | null | undefined): string | null => {
  if (!s) return null;
  const parts = s.slice(0, 10).split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
};

// ── Field helper para o Sheet ─────────────────────────────────────────────────
function SField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value ?? '—'}</p>
    </div>
  );
}

// ── Status filters ────────────────────────────────────────────────────────────
const STATUS_OPTIONS: PillOption<'all' | 'concluida' | 'andamento'>[] = [
  { value: 'all', label: 'Todos' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'andamento', label: 'Em andamento' },
];

const BILLING_OPTIONS: PillOption<'all' | 'faturada' | 'nao_faturada'>[] = [
  { value: 'all', label: 'Todos' },
  { value: 'faturada', label: 'Faturada' },
  { value: 'nao_faturada', label: 'Não faturada' },
];

// ── Page ──────────────────────────────────────────────────────────────────────
const FinancialPage = () => {
  const navigate = useNavigate();
  const { data: kpis, isLoading: isKpiLoading, isError: isKpiError } = useBillingKpis();

  // OS state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'concluida' | 'andamento'>('all');
  const [billingFilter, setBillingFilter] = useState<'all' | 'faturada' | 'nao_faturada'>('nao_faturada');
  const [ordersPage, setOrdersPage] = useState(1);

  // MiniOS state
  const [miniOsSearch, setMiniOsSearch] = useState('');
  const [miniOsBillingFilter, setMiniOsBillingFilter] = useState<'all' | 'faturada' | 'nao_faturada'>('all');
  const [miniPage, setMiniPage] = useState(1);

  // Sheet state — OS
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<'cobranca' | 'historico'>('cobranca');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [faturamentoValue, setFaturamentoValue] = useState<'sim' | 'nao' | ''>('');
  const [billingDate, setBillingDate] = useState('');
  const [nfNumber, setNfNumber] = useState('');

  // Dialog state — MiniOS
  const [isMiniDialogOpen, setIsMiniDialogOpen] = useState(false);
  const [selectedMiniId, setSelectedMiniId] = useState<number | null>(null);
  const [miniBillingValue, setMiniBillingValue] = useState<'sim' | 'nao' | ''>('');
  const [miniNfNumber, setMiniNfNumber] = useState('');

  const { data: ordersPageData, isLoading, isError } = useBillingServiceOrdersPage({
    page: ordersPage,
    pageSize: PAGE_SIZE,
    q: searchTerm,
    liberada: 'true',
    concluida:
      statusFilter === 'concluida' ? 'true' : statusFilter === 'andamento' ? 'false' : 'all',
    faturada:
      billingFilter === 'faturada' ? 'true' : billingFilter === 'nao_faturada' ? 'false' : 'all',
  });
  const orders = ordersPageData?.items ?? [];
  const ordersTotalPages = ordersPageData?.totalPages ?? 1;

  const { data: miniOsPageData, isLoading: isMiniOsLoading, isError: isMiniOsError } = useMiniOsPage({
    page: miniPage,
    pageSize: PAGE_SIZE,
    q: miniOsSearch,
    faturada:
      miniOsBillingFilter === 'faturada'
        ? 'true'
        : miniOsBillingFilter === 'nao_faturada'
        ? 'false'
        : 'all',
  });
  const miniOs = miniOsPageData?.items ?? [];
  const miniOsTotalPages = miniOsPageData?.totalPages ?? 1;

  const { data: orderDetail, isLoading: isDetailLoading, isError: isDetailError } =
    useServiceOrder(selectedOrderId ? String(selectedOrderId) : undefined);
  const updateServiceOrderBilling = useUpdateServiceOrderBilling();

  const { data: miniDetail, isLoading: isMiniDetailLoading, isError: isMiniDetailError } =
    useMiniOsDetail(selectedMiniId ?? undefined);
  const updateMiniOs = useUpdateMiniOs();

  const { canAccessFinancials } = useUserRole();

  // Reset pages on filter change
  useEffect(() => { setOrdersPage(1); }, [searchTerm, statusFilter, billingFilter]);
  useEffect(() => { setMiniPage(1); }, [miniOsSearch, miniOsBillingFilter]);
  useEffect(() => {
    if (ordersPage > ordersTotalPages) setOrdersPage(ordersTotalPages);
  }, [ordersPage, ordersTotalPages]);
  useEffect(() => {
    if (miniPage > miniOsTotalPages) setMiniPage(miniOsTotalPages);
  }, [miniPage, miniOsTotalPages]);

  // Populate OS dialog from detail
  useEffect(() => {
    if (!orderDetail) { setFaturamentoValue(''); setBillingDate(''); setNfNumber(''); return; }
    setFaturamentoValue(orderDetail.faturada ? 'sim' : 'nao');
    setBillingDate(orderDetail.data_faturamento ?? '');
    setNfNumber(orderDetail.numero_nf != null ? String(orderDetail.numero_nf) : '');
  }, [orderDetail]);

  // Populate MiniOS dialog from detail
  useEffect(() => {
    if (!miniDetail) { setMiniBillingValue(''); setMiniNfNumber(''); return; }
    setMiniBillingValue(miniDetail.faturada ? 'sim' : 'nao');
    setMiniNfNumber(miniDetail.numero_nf ?? '');
  }, [miniDetail]);

  const openSheet = (id: number, tab: 'cobranca' | 'historico') => {
    setSheetTab(tab);
    setSelectedOrderId(id);
    setIsDialogOpen(true);
  };
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) { setSelectedOrderId(null); setFaturamentoValue(''); setBillingDate(''); setNfNumber(''); }
  };
  const handleMiniEditClick = (id: number) => { setSelectedMiniId(id); setIsMiniDialogOpen(true); };
  const handleMiniDialogChange = (open: boolean) => {
    setIsMiniDialogOpen(open);
    if (!open) { setSelectedMiniId(null); setMiniBillingValue(''); setMiniNfNumber(''); }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    try {
      await updateServiceOrderBilling.mutateAsync({
        id: selectedOrderId,
        payload: { data_faturamento: billingDate || null, numero_nf: nfNumber ? Number(nfNumber) : null },
      });
    } catch (err) { console.error(err); }
  };

  const handleMiniSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMiniId) return;
    try {
      await updateMiniOs.mutateAsync({
        id: selectedMiniId,
        payload: { faturada: miniBillingValue === 'sim', numero_nf: miniNfNumber || null },
      });
    } catch (err) { console.error(err); }
  };

  const renderBadge = (condition: boolean, positive: string, negative: string) => (
    <Badge className={condition ? 'bg-status-completed text-primary-foreground' : 'bg-status-pending text-primary-foreground'}>
      {condition ? positive : negative}
    </Badge>
  );

  const renderPager = (page: number, totalPages: number, setPage: (v: number) => void) => {
    if (totalPages <= 1) return null;
    const items: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let p = 1; p <= totalPages; p++) items.push(p);
    } else {
      items.push(1);
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
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
              <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }} className={page === 1 ? 'pointer-events-none opacity-50' : ''} />
            </PaginationItem>
            {items.map((item, idx) => (
              <PaginationItem key={`${item}-${idx}`}>
                {item === 'ellipsis' ? <PaginationEllipsis /> : (
                  <PaginationLink href="#" isActive={item === page} onClick={(e) => { e.preventDefault(); setPage(item as number); }}>{item}</PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} />
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
          <CardContent>
            <p className="text-muted-foreground">
              Seu perfil não possui permissão para visualizar as informações financeiras.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // KPI proportions
  const kpiTotal = (kpis?.total_faturado ?? 0) + (kpis?.total_para_faturar ?? 0) + (kpis?.total_sem_liberacao ?? 0);
  const pctFaturado     = kpiTotal > 0 ? ((kpis?.total_faturado     ?? 0) / kpiTotal) * 100 : 0;
  const pctParaFaturar  = kpiTotal > 0 ? ((kpis?.total_para_faturar  ?? 0) / kpiTotal) * 100 : 0;
  const pctSemLiberacao = kpiTotal > 0 ? ((kpis?.total_sem_liberacao ?? 0) / kpiTotal) * 100 : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">Ordens de serviço disponíveis para faturamento</p>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      {isKpiLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-7 w-36" />
                <Skeleton className="h-1 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isKpiLoading && isKpiError && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4 text-destructive text-sm">
            Não foi possível carregar os indicadores de faturamento.
          </CardContent>
        </Card>
      )}

      {!isKpiLoading && !isKpiError && kpis && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="Total faturado"
            value={kpis.total_faturado ?? 0}
            icon={DollarSign}
            iconColor="bg-green-500/10 text-green-600 dark:text-green-400"
            barColor="bg-green-500"
            pct={pctFaturado}
          />
          <KpiCard
            label="Para faturar"
            value={kpis.total_para_faturar ?? 0}
            icon={Clock}
            iconColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            barColor="bg-amber-400"
            pct={pctParaFaturar}
          />
          <KpiCard
            label="Sem liberação"
            value={kpis.total_sem_liberacao ?? 0}
            icon={AlertCircle}
            iconColor="bg-muted text-muted-foreground"
            barColor="bg-muted-foreground"
            pct={pctSemLiberacao}
          />
        </div>
      )}

      {/* ── Main table card ──────────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <Tabs defaultValue="os">
          <div className="flex items-center justify-between px-4 h-12 border-b border-border">
            <p className="text-sm font-semibold">Cobrança</p>
            <TabsList className="h-8">
              <TabsTrigger value="os" className="text-xs px-3">Ordens de Serviço</TabsTrigger>
              <TabsTrigger value="minios" className="text-xs px-3">Tarefas Rápidas</TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-0">

            {/* ── OS tab ─────────────────────────────────────────────────────── */}
            <TabsContent value="os" className="mt-0">
              {/* Filters */}
              <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-border">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Buscar por cliente ou nº OS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 bg-secondary border-border text-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                  <SelectTrigger className="h-9 w-44 bg-secondary border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="andamento">Em andamento</SelectItem>
                  </SelectContent>
                </Select>
                <PillFilter options={BILLING_OPTIONS} value={billingFilter} onChange={setBillingFilter} />
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3">
                        Ordem de Serviço
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[90px]">
                        Liberação
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[130px]">
                        Liberado por
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[110px] text-right">
                        Valor
                      </TableHead>
                      <TableHead className="py-2 px-3 w-[40px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading &&
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={`sk-${i}`} className="border-border">
                          <TableCell className="py-3 px-3">
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-40" />
                              <div className="flex gap-3">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-12" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-3"><Skeleton className="h-3 w-16" /></TableCell>
                          <TableCell className="py-3 px-3"><Skeleton className="h-3 w-20" /></TableCell>
                          <TableCell className="py-3 px-3"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                          <TableCell className="py-3 px-3" />
                        </TableRow>
                      ))}

                    {isError && !isLoading && (
                      <TableRow className="border-border">
                        <TableCell colSpan={4} className="py-8 text-center text-sm text-destructive">
                          Não foi possível carregar as ordens de serviço.
                        </TableCell>
                      </TableRow>
                    )}

                    {!isLoading && !isError && orders.length === 0 && (
                      <TableRow className="border-border">
                        <TableCell colSpan={4} className="py-10 text-center">
                          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Nenhuma ordem encontrada</p>
                        </TableCell>
                      </TableRow>
                    )}

                    {!isLoading && !isError && orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="border-border hover:bg-muted/40 transition-colors group"
                      >
                        <TableCell className="py-3 px-3">
                          <div>
                            <span className="text-sm font-semibold uppercase">{order.cliente_nome}</span>
                            <div className="flex items-center gap-3 mt-1.5">
                              {dotBadge(
                                order.concluida ? 'bg-status-completed' : 'bg-status-progress',
                                order.concluida ? 'Concluída' : 'Em andamento',
                              )}
                              {dotBadge(
                                order.faturada ? 'bg-green-600' : 'bg-amber-500',
                                order.faturada ? 'Faturada' : 'Lib. faturamento',
                              )}
                              <span className="font-mono text-[10px] text-muted-foreground">#{order.id}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {safeFormatDate(order.liberada_para_faturamento_em) ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          <span className="text-xs text-muted-foreground truncate block max-w-[120px]">
                            {order.liberada_para_faturamento_por_nome ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-3 text-right">
                          <span className="text-sm font-semibold tabular-nums">
                            <MoneyValue value={Number(order.valor ?? 0)} formatter={formatCurrency} />
                          </span>
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => openSheet(order.id, 'cobranca')}>
                                <Receipt className="mr-2 h-3.5 w-3.5" /> Faturamento
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openSheet(order.id, 'historico')}>
                                <History className="mr-2 h-3.5 w-3.5" /> Histórico
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/orders/${order.id}`)}>
                                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Ver OS
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="px-4">
                {renderPager(ordersPage, ordersTotalPages, setOrdersPage)}
              </div>
            </TabsContent>

            {/* ── MiniOS tab ──────────────────────────────────────────────────── */}
            <TabsContent value="minios" className="mt-0">
              {/* Filters */}
              <div className="px-4 py-3 flex flex-wrap items-center gap-2 border-b border-border">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Buscar por cliente ou ID..."
                    value={miniOsSearch}
                    onChange={(e) => setMiniOsSearch(e.target.value)}
                    className="pl-9 h-9 bg-secondary border-border text-sm"
                  />
                </div>
                <PillFilter options={BILLING_OPTIONS} value={miniOsBillingFilter} onChange={setMiniOsBillingFilter} />
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3">
                        Tarefa Rápida
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[90px]">
                        Recebimento
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[130px]">
                        Responsável
                      </TableHead>
                      <TableHead className="py-2 px-3 w-[40px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isMiniOsLoading &&
                      Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={`sk-mini-${i}`} className="border-border">
                          <TableCell className="py-3 px-3">
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-40" />
                              <div className="flex gap-3">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-12" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-3"><Skeleton className="h-3 w-16" /></TableCell>
                          <TableCell className="py-3 px-3"><Skeleton className="h-3 w-20" /></TableCell>
                          <TableCell className="py-3 px-3" />
                        </TableRow>
                      ))}

                    {isMiniOsError && !isMiniOsLoading && (
                      <TableRow className="border-border">
                        <TableCell colSpan={4} className="py-8 text-center text-sm text-destructive">
                          Não foi possível carregar as tarefas rápidas.
                        </TableCell>
                      </TableRow>
                    )}

                    {!isMiniOsLoading && !isMiniOsError && miniOs.length === 0 && (
                      <TableRow className="border-border">
                        <TableCell colSpan={4} className="py-10 text-center">
                          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Nenhuma tarefa rápida encontrada</p>
                        </TableCell>
                      </TableRow>
                    )}

                    {!isMiniOsLoading && !isMiniOsError && miniOs.map((mini) => {
                      const isFinished = (mini.status ?? '').toLowerCase() === 'finalizada';
                      return (
                        <TableRow
                          key={mini.id}
                          className="border-border hover:bg-muted/40 cursor-pointer transition-colors group"
                          onClick={() => handleMiniEditClick(mini.id)}
                        >
                          <TableCell className="py-3 px-3">
                            <div>
                              <span className="text-sm font-semibold uppercase">
                                {mini.cliente_nome ?? 'Cliente não informado'}
                              </span>
                              <div className="flex items-center gap-3 mt-1.5">
                                {dotBadge(
                                  isFinished ? 'bg-status-completed' : 'bg-status-progress',
                                  mini.status_display ?? (isFinished ? 'Finalizada' : 'Em andamento'),
                                )}
                                {dotBadge(
                                  mini.faturada ? 'bg-green-600' : 'bg-amber-500',
                                  mini.faturada ? 'Faturada' : 'Não faturada',
                                )}
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {mini.servico_nome ? `· ${mini.servico_nome}` : ''}
                                  {' '}#{mini.id}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-3">
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {mini.data_recebimento
                                ? new Date(mini.data_recebimento.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR')
                                : '—'}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-3">
                            <span className="text-xs text-muted-foreground truncate block max-w-[120px]">
                              {mini.responsavel_nome ?? '—'}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-3">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleMiniEditClick(mini.id); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
                              title="Editar tarefa rápida"
                            >
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="px-4">
                {renderPager(miniPage, miniOsTotalPages, setMiniPage)}
              </div>
            </TabsContent>

          </CardContent>
        </Tabs>
      </Card>

      {/* ── OS Billing Sheet ─────────────────────────────────────────────────── */}
      <Sheet open={isDialogOpen} onOpenChange={handleDialogChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[680px]">

          {/* Header */}
          <SheetHeader className="flex-row items-start justify-between gap-4 border-b border-border px-6 py-4 pr-14 space-y-0">
            <div className="min-w-0">
              <SheetTitle className="truncate text-base">
                {orderDetail?.cliente_detail?.nome ?? `OS #${selectedOrderId}`}
              </SheetTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">OS #{selectedOrderId}</p>
            </div>
            <Link
              to={`/dashboard/orders/${selectedOrderId}`}
              onClick={() => handleDialogChange(false)}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Ver OS
            </Link>
          </SheetHeader>

          {/* Tabs */}
          <Tabs value={sheetTab} onValueChange={(v) => setSheetTab(v as 'cobranca' | 'historico')} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent px-6 pt-1">
              <TabsTrigger value="cobranca" className="rounded-none border-b-2 border-transparent bg-transparent px-4 pb-2.5 pt-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
                Cobrança
              </TabsTrigger>
              <TabsTrigger value="historico" className="rounded-none border-b-2 border-transparent bg-transparent px-4 pb-2.5 pt-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none">
                Histórico
              </TabsTrigger>
            </TabsList>

            {/* ── Aba Cobrança ── */}
            <TabsContent value="cobranca" className="m-0 flex-1 overflow-y-auto">
              {isDetailLoading && (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  Carregando...
                </div>
              )}
              {isDetailError && !isDetailLoading && (
                <div className="flex items-center justify-center py-12 text-sm text-destructive">
                  Não foi possível carregar os detalhes.
                </div>
              )}
              {!isDetailLoading && !isDetailError && orderDetail && (
                <div className="space-y-5 px-6 py-5">

                  {/* Valor + status faturamento */}
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Valor total</p>
                      <p className="text-[28px] font-bold leading-none tracking-tight">
                        <MoneyValue value={Number(orderDetail.valor ?? 0)} formatter={formatCurrency} />
                      </p>
                    </div>
                    <span className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-semibold',
                      orderDetail.faturada
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : orderDetail.liberada_para_faturamento
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    )}>
                      {orderDetail.faturada ? 'Faturada' : orderDetail.liberada_para_faturamento ? 'Liberada para fat.' : 'Não faturada'}
                    </span>
                  </div>

                  {/* Dados financeiros */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <SField
                      label={orderDetail.cliente_detail?.tipo_inscricao?.toUpperCase() ?? 'CNPJ'}
                      value={orderDetail.cliente_detail?.numero_inscricao ?? 'Não informado'}
                    />
                    <SField label="Forma de pagamento" value={(orderDetail as any).forma_pagamento_display ?? orderDetail.forma_pagamento} />
                    {orderDetail.quantidade_parcelas ? (
                      <SField label="Parcelas" value={`${orderDetail.quantidade_parcelas}x`} />
                    ) : null}
                    <SField label="Cobrança imediata" value={orderDetail.cobranca_imediata ? 'Sim' : 'Não'} />
                    {(orderDetail as any).liberada_para_faturamento_em ? (
                      <SField label="Lib. faturamento em" value={safeFormatDate((orderDetail as any).liberada_para_faturamento_em)} />
                    ) : null}
                    {(orderDetail as any).liberada_para_faturamento_por_nome ? (
                      <SField label="Liberada por" value={(orderDetail as any).liberada_para_faturamento_por_nome} />
                    ) : null}
                    {orderDetail.numero_nf ? (
                      <SField label="Número NF" value={String(orderDetail.numero_nf)} />
                    ) : null}
                    {orderDetail.data_faturamento ? (
                      <SField label="Faturada em" value={safeFormatDate(orderDetail.data_faturamento)} />
                    ) : null}
                    {(orderDetail as any).faturada_por_nome ? (
                      <SField label="Faturada por" value={(orderDetail as any).faturada_por_nome} />
                    ) : null}
                  </div>

                  <Separator />

                  {/* Dados da OS */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <SField label="Criado por" value={orderDetail.criado_por_nome} />
                    <SField label="Data de criação" value={safeFormatDate(orderDetail.data_criacao)} />
                    {orderDetail.data_conclusao_os ? (
                      <SField label="Concluída em" value={safeFormatDate(orderDetail.data_conclusao_os)} />
                    ) : null}
                    {orderDetail.finalizador_nome ? (
                      <SField label="Finalizada por" value={orderDetail.finalizador_nome} />
                    ) : null}
                  </div>

                  {(orderDetail.nome_contato_envio_nf || orderDetail.contato_envio_nf) && (
                    <>
                      <Separator />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Contato para envio de NF
                      </p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {orderDetail.nome_contato_envio_nf && (
                          <SField label="Nome" value={orderDetail.nome_contato_envio_nf} />
                        )}
                        {orderDetail.contato_envio_nf && (
                          <SField label="E-mail / Telefone" value={orderDetail.contato_envio_nf} />
                        )}
                      </div>
                    </>
                  )}

                  {orderDetail.observacao && (
                    <>
                      <Separator />
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground">Observação</p>
                        <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm leading-relaxed">
                          {orderDetail.observacao}
                        </p>
                      </div>
                    </>
                  )}

                  {(orderDetail.servicos?.length ?? 0) > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Serviços</p>
                        <ul className="space-y-1">
                          {orderDetail.servicos.map((svc) => (
                            <li key={svc.id} className="text-sm text-foreground">
                              {svc.repositorio?.nome ?? 'Serviço sem nome'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  <Separator />

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Atualizar faturamento
                    </p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="faturamento">Faturamento</Label>
                        <Select value={faturamentoValue} onValueChange={(v) => setFaturamentoValue(v as 'sim' | 'nao')} disabled={updateServiceOrderBilling.isPending}>
                          <SelectTrigger id="faturamento"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sim">Sim</SelectItem>
                            <SelectItem value="nao">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="data-faturamento">Data do faturamento</Label>
                        <Input id="data-faturamento" type="date" value={billingDate} onChange={(e) => setBillingDate(e.target.value)} disabled={updateServiceOrderBilling.isPending} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="numero-nf">Número da NF</Label>
                        <Input id="numero-nf" type="number" value={nfNumber} onChange={(e) => setNfNumber(e.target.value)} disabled={updateServiceOrderBilling.isPending} />
                      </div>
                    </div>
                    <div className="flex justify-end pb-2">
                      <Button type="submit" disabled={updateServiceOrderBilling.isPending}>
                        {updateServiceOrderBilling.isPending ? 'Salvando...' : 'Salvar alterações'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </TabsContent>

            {/* ── Aba Histórico ── */}
            <TabsContent value="historico" className="m-0 flex-1 overflow-y-auto px-6">
              {selectedOrderId && <OrdemAuditoriaTimeline ordemId={selectedOrderId} />}
            </TabsContent>
          </Tabs>

        </SheetContent>
      </Sheet>

      {/* ── MiniOS Billing Dialog (unchanged) ───────────────────────────────── */}
      <Dialog open={isMiniDialogOpen} onOpenChange={handleMiniDialogChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da tarefa rápida</DialogTitle>
          </DialogHeader>

          {isMiniDetailLoading && (
            <div className="py-6 text-center text-muted-foreground">Carregando detalhes da tarefa rápida...</div>
          )}

          {isMiniDetailError && !isMiniDetailLoading && (
            <div className="py-6 text-center text-destructive">Não foi possível carregar os detalhes da tarefa rápida.</div>
          )}

          {!isMiniDetailLoading && !isMiniDetailError && miniDetail && (
            <div className="space-y-6 pb-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase">Cliente</h3>
                <p className="text-lg font-bold">{miniDetail.cliente_detail?.nome ?? 'Cliente não informado'}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <span className="text-xs text-muted-foreground">Quantidade</span>
                  <p className="text-base font-medium">{miniDetail.quantidade ?? '-'}</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <div className="mt-1">
                    {renderBadge((miniDetail.status ?? '').toLowerCase() === 'finalizada', 'Finalizada', miniDetail.status ?? 'Em andamento')}
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <span className="text-xs text-muted-foreground">NF atual</span>
                  <p className="text-base font-medium">{miniDetail.numero_nf ?? '-'}</p>
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
                <p className="text-base font-medium">{miniDetail.servico_detail?.nome ?? '-'}</p>
              </div>

              <div className="rounded-lg bg-secondary/50 p-4">
                <span className="text-xs text-muted-foreground">Descrição</span>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {miniDetail.descricao?.trim() || 'Sem descrição.'}
                </p>
              </div>

              <div className="rounded-lg bg-secondary/50 p-4">
                <span className="text-xs text-muted-foreground">Responsável</span>
                <p className="text-base font-medium">{miniDetail.responsavel_nome ?? 'Não informado'}</p>
              </div>

              <form onSubmit={handleMiniSubmit} className="space-y-4">
                <h4 className="text-sm font-semibold uppercase text-muted-foreground">Atualizar faturamento</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mini-faturamento">Faturamento</Label>
                    <Select value={miniBillingValue} onValueChange={(v) => setMiniBillingValue(v as 'sim' | 'nao')} disabled={updateMiniOs.isPending}>
                      <SelectTrigger id="mini-faturamento"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mini-nf">Número da NF</Label>
                    <Input id="mini-nf" value={miniNfNumber} onChange={(e) => setMiniNfNumber(e.target.value)} placeholder="Ex.: 12345" disabled={updateMiniOs.isPending} />
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
