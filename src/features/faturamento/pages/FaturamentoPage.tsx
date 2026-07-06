import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoneyValue } from '@/components/common/MoneyValue';
import { formatCurrency } from '@/data/mockData';
import { useUserRole } from '@/hooks/useUserRole';
import { useBillingKpis, useBillingServiceOrdersPage, useMiniOsPage } from '../hooks';
import { safeFormatDate } from '../utils';
import { KpiCard } from '../components/KpiCard';
import { PillFilter, PillOption } from '../components/PillFilter';
import { DotBadge } from '../components/DotBadge';
import { BillingPager } from '../components/BillingPager';
import { OrdemBillingSheet } from '../components/OrdemBillingSheet';
import { MiniOsBillingDialog } from '../components/MiniOsBillingDialog';

const PAGE_SIZE = 20;

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

const FaturamentoPage = () => {
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

  // Dialog state — MiniOS
  const [isMiniDialogOpen, setIsMiniDialogOpen] = useState(false);
  const [selectedMiniId, setSelectedMiniId] = useState<number | null>(null);

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

  const openSheet = (id: number, tab: 'cobranca' | 'historico') => {
    setSheetTab(tab);
    setSelectedOrderId(id);
    setIsDialogOpen(true);
  };
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setSelectedOrderId(null);
  };
  const handleMiniEditClick = (id: number) => { setSelectedMiniId(id); setIsMiniDialogOpen(true); };
  const handleMiniDialogChange = (open: boolean) => {
    setIsMiniDialogOpen(open);
    if (!open) setSelectedMiniId(null);
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
                              <DotBadge
                                colorClass={order.concluida ? 'bg-status-completed' : 'bg-status-progress'}
                                label={order.concluida ? 'Concluída' : 'Em andamento'}
                              />
                              <DotBadge
                                colorClass={order.faturada ? 'bg-green-600' : 'bg-amber-500'}
                                label={order.faturada ? 'Faturada' : 'Lib. faturamento'}
                              />
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
                <BillingPager page={ordersPage} totalPages={ordersTotalPages} setPage={setOrdersPage} />
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
                                <DotBadge
                                  colorClass={isFinished ? 'bg-status-completed' : 'bg-status-progress'}
                                  label={mini.status_display ?? (isFinished ? 'Finalizada' : 'Em andamento')}
                                />
                                <DotBadge
                                  colorClass={mini.faturada ? 'bg-green-600' : 'bg-amber-500'}
                                  label={mini.faturada ? 'Faturada' : 'Não faturada'}
                                />
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
                <BillingPager page={miniPage} totalPages={miniOsTotalPages} setPage={setMiniPage} />
              </div>
            </TabsContent>

          </CardContent>
        </Tabs>
      </Card>

      <OrdemBillingSheet
        orderId={selectedOrderId}
        open={isDialogOpen}
        onOpenChange={handleDialogChange}
        tab={sheetTab}
        onTabChange={setSheetTab}
      />

      <MiniOsBillingDialog
        miniId={selectedMiniId}
        open={isMiniDialogOpen}
        onOpenChange={handleMiniDialogChange}
      />
    </div>
  );
};

export default FaturamentoPage;
