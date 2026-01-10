import {
  ClipboardList,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import UnderDevelopmentOverlay from '@/components/UnderDevelopmentOverlay';
import { SHOW_DASHBOARD_UNDER_DEVELOPMENT } from '@/config/features';
import { useDashboardAnalytics, DashboardServiceMonthlyItem } from '@/services/dashboard';
import { useUserRole } from '@/hooks/useUserRole';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const COLORS = [
  'hsl(173, 80%, 40%)',
  'hsl(215, 85%, 60%)',
  'hsl(280, 70%, 60%)',
  'hsl(45, 85%, 55%)',
  'hsl(0, 75%, 60%)',
  'hsl(200, 70%, 55%)',
];

const STATUS_COLORS = [
  'hsl(45, 93%, 47%)',
  'hsl(173, 80%, 40%)',
  'hsl(142, 76%, 36%)',
  'hsl(0, 84%, 60%)',
];

const tooltipContentStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--popover-foreground))',
};

const tooltipItemStyle = {
  color: 'hsl(var(--popover-foreground))',
};

const tooltipLabelStyle = {
  color: 'hsl(var(--popover-foreground))',
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const toPercentage = (partial: number, total: number): number => {
  if (!Number.isFinite(partial) || !Number.isFinite(total) || total <= 0) return 0;
  return (partial / total) * 100;
};

const clampMonthIndex = (month: number): number => {
  if (!Number.isFinite(month)) return 0;
  if (month < 1) return 0;
  if (month > 12) return 11;
  return Math.floor(month) - 1;
};

const resolveMonthlyLabel = (entry: DashboardServiceMonthlyItem, index: number): { label: string; sortKey: number } => {
  const raw = entry.mes ?? entry.month ?? entry.periodo;
  const yearFromEntry = entry.ano;

  const buildLabel = (monthIndex: number, year: number) => {
    const safeMonth = ((monthIndex % 12) + 12) % 12;
    return `${MONTHS[safeMonth]}/${year}`;
  };

  const buildSortKey = (monthIndex: number, year: number) => year * 12 + monthIndex;

  if (typeof raw === 'number') {
    const year = typeof yearFromEntry === 'number' ? yearFromEntry : new Date().getFullYear();
    const monthIndex = clampMonthIndex(raw);
    return { label: buildLabel(monthIndex, year), sortKey: buildSortKey(monthIndex, year) };
  }

  if (typeof raw === 'string' && raw.trim() !== '') {
    const normalized = raw.trim();

    const isoMatch = normalized.match(/^(\d{4})[-/](\d{1,2})$/);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const monthIndex = clampMonthIndex(Number(isoMatch[2]));
      return { label: buildLabel(monthIndex, year), sortKey: buildSortKey(monthIndex, year) };
    }

    const altMatch = normalized.match(/^(\d{1,2})[-/](\d{4})$/);
    if (altMatch) {
      const monthIndex = clampMonthIndex(Number(altMatch[1]));
      const year = Number(altMatch[2]);
      return { label: buildLabel(monthIndex, year), sortKey: buildSortKey(monthIndex, year) };
    }

    let parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime()) && /^\d{4}-\d{2}$/.test(normalized)) {
      parsed = new Date(`${normalized}-01`);
    }
    if (Number.isNaN(parsed.getTime()) && /^\d{2}\/\d{4}$/.test(normalized)) {
      const [monthStr, yearStr] = normalized.split('/');
      parsed = new Date(Number(yearStr), Number(monthStr) - 1, 1);
    }
    if (!Number.isNaN(parsed.getTime())) {
      const monthIndex = parsed.getMonth();
      const year = parsed.getFullYear();
      return { label: buildLabel(monthIndex, year), sortKey: buildSortKey(monthIndex, year) };
    }

    return { label: normalized, sortKey: index };
  }

  if (typeof yearFromEntry === 'number') {
    return { label: String(yearFromEntry), sortKey: buildSortKey(0, yearFromEntry) };
  }

  return { label: `Período ${index + 1}`, sortKey: index };
};

const DashboardPage = () => {
  const { data: analytics, isLoading, isError } = useDashboardAnalytics();
  const [completedPeriodMonths, setCompletedPeriodMonths] = useState<string>('6');
  const { canViewOrderValues } = useUserRole();

  const stats = useMemo(() => {
    if (!analytics) return [];

    const totalOrders = Number(analytics.ordens_servico?.total ?? 0);
    const totalOrdersCompleted = Number(analytics.ordens_servico?.total_concluidas ?? 0);
    const totalOrdersNotCompleted = Number(analytics.ordens_servico?.total_nao_concluidas ?? 0);

    const completedRate = toPercentage(totalOrdersCompleted, totalOrders);
    const inProgressRate = toPercentage(totalOrdersNotCompleted, totalOrders);

    return [
      {
        title: 'Total de Ordens de Serviço',
        value: totalOrders.toLocaleString('pt-BR'),
        change: `${completedRate.toFixed(1)}% concluídas`,
        changeType: 'positive' as const,
        icon: ClipboardList,
      },
      {
        title: 'Total Concluídas',
        value: totalOrdersCompleted.toLocaleString('pt-BR'),
        change: `${completedRate.toFixed(1)}% do total`,
        changeType: 'positive' as const,
        icon: CheckCircle,
      },
      {
        title: 'Total em Andamento',
        value: totalOrdersNotCompleted.toLocaleString('pt-BR'),
        change: `${inProgressRate.toFixed(1)}% do total`,
        changeType: 'negative' as const,
        icon: Clock,
      },
    ];
  }, [analytics]);

  const topServicesData = useMemo(() => {
    const list = analytics?.servicos?.principais_por_quantidade ?? [];
    return list
      .map((item) => ({
        id: item.repositorio_id,
        name: item.repositorio_nome,
        value: Number(item.total ?? 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [analytics]);

  const totalTopServices = useMemo(
    () => topServicesData.reduce((acc, cur) => acc + (cur.value ?? 0), 0),
    [topServicesData],
  );

  const servicesByStatus = useMemo(
    () =>
      (analytics?.servicos?.por_status ?? []).map((item) => ({
        name: item.status_display ?? item.status,
        value: Number(item.total ?? 0),
      })),
    [analytics],
  );

  const monthlyCompletionSeries = useMemo(() => {
    const entries = analytics?.servicos?.concluidos_por_mes ?? [];
    return entries
      .map((entry, index) => {
        const { label, sortKey } = resolveMonthlyLabel(entry, index);
        const value = Number(entry.total ?? 0);
        return { name: label, value, sortKey };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [analytics]);

  const filteredMonthlyCompletion = useMemo(() => {
    if (!monthlyCompletionSeries.length) return [];
    const limit = parseInt(completedPeriodMonths, 10);
    if (!Number.isFinite(limit) || limit <= 0) return monthlyCompletionSeries;
    return monthlyCompletionSeries.slice(Math.max(monthlyCompletionSeries.length - limit, 0));
  }, [monthlyCompletionSeries, completedPeriodMonths]);

  const fallbackCompletionSeries = useMemo(() => {
    const total = Number(
      analytics?.servicos?.concluidos_ultimos_12_meses_total ??
        analytics?.servicos?.concluidos_ultimos_12_meses ??
        0,
    );
    if (!total) return [];
    return [{ name: 'Últimos 12 meses', value: total }];
  }, [analytics]);

  const completedBarData = filteredMonthlyCompletion.length
    ? filteredMonthlyCompletion.map(({ name, value }) => ({ name, value }))
    : fallbackCompletionSeries;

  const { changePct, changePositive, hasTrend } = useMemo(() => {
    if (monthlyCompletionSeries.length < 2) {
      return { changePct: 0, changePositive: true, hasTrend: false };
    }
    const last = monthlyCompletionSeries[monthlyCompletionSeries.length - 1].value;
    const prev = monthlyCompletionSeries[monthlyCompletionSeries.length - 2].value;
    const pct = prev === 0 ? (last > 0 ? 100 : 0) : Math.round(((last - prev) / prev) * 100);
    return { changePct: pct, changePositive: pct >= 0, hasTrend: true };
  }, [monthlyCompletionSeries]);

  const tasksByStatus = useMemo(
    () =>
      (analytics?.tarefas?.por_status ?? []).map((item) => ({
        name: item.status_display ?? item.status,
        value: Number(item.total ?? 0),
      })),
    [analytics],
  );

  const tasksMonthlySeries = useMemo(() => {
    const entries = analytics?.tarefas?.concluidas_por_mes ?? [];
    return entries
      .map((entry, index) => {
        const { label, sortKey } = resolveMonthlyLabel(
          { mes: entry.mes, ano: entry.ano, total: entry.total },
          index,
        );
        const value = Number(entry.total ?? 0);
        return { name: label, value, sortKey };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [analytics]);

  const tasksMonthlyChartData = useMemo(
    () => tasksMonthlySeries.map(({ name, value }) => ({ name, value })),
    [tasksMonthlySeries],
  );

  const miniosMonthlySeries = useMemo(() => {
    const entries = analytics?.minios?.concluidas_por_mes ?? [];
    return entries
      .map((entry, index) => {
        const { label, sortKey } = resolveMonthlyLabel(
          { mes: entry.mes, ano: entry.ano, total: entry.total },
          index,
        );
        const value = Number(entry.total ?? 0);
        return { name: label, value, sortKey };
      })
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [analytics]);

  const miniosFallbackSeries = useMemo(() => {
    const total = Number(analytics?.minios?.concluidas_ultimos_12_meses_total ?? 0);
    if (!total) return [];
    return [{ name: 'Últimos 12 meses', value: total }];
  }, [analytics]);

  const miniosChartData = miniosMonthlySeries.length
    ? miniosMonthlySeries.map(({ name, value }) => ({ name, value }))
    : miniosFallbackSeries;

  const topClientsData = useMemo(() => {
    const list = analytics?.clientes?.mais_faturamento ?? [];
    return list
      .slice()
      .sort((a, b) => (b.total_valor_faturado ?? 0) - (a.total_valor_faturado ?? 0))
      .map((item) => ({
        id: item.cliente_id,
        name: item.cliente_nome,
        value: Number(item.total_valor_faturado ?? 0),
      }))
      .slice(0, 8);
  }, [analytics]);

  const totalClientsValue = useMemo(
    () => topClientsData.reduce((acc, cur) => acc + (cur.value ?? 0), 0),
    [topClientsData],
  );

  const trendColorClass = hasTrend
    ? changePositive
      ? 'text-status-completed'
      : 'text-destructive'
    : 'text-muted-foreground';
  const trendText = hasTrend
    ? `${changePositive ? '+' : ''}${changePct}% vs período anterior`
    : 'Sem histórico para comparar';

  return (
    <>
      {SHOW_DASHBOARD_UNDER_DEVELOPMENT && <UnderDevelopmentOverlay />}
      <div className="space-y-6 animate-fade-in">
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription>
              Não foi possível recuperar os dados de análise. Tente novamente em instantes.
            </AlertDescription>
          </Alert>
        )}
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(stats.length ? stats : Array.from({ length: 3 })).map((stat, index) => (
          <Card
            key={stat ? stat.title : `stat-skeleton-${index}`}
            className="bg-card border-border hover:border-primary/30 transition-colors"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                {stat ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <div
                        className={`flex items-center gap-1 mt-2 text-sm ${
                          stat.changeType === 'positive' ? 'text-status-completed' : 'text-destructive'
                        }`}
                      >
                        {stat.changeType === 'positive' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        {stat.change}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded-xl" />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Serviços Concluídos por Período</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-2 text-sm ${trendColorClass}`}>
              <TrendingUp className="w-4 h-4" />
              {trendText}
            </div>
            <Select value={completedPeriodMonths} onValueChange={setCompletedPeriodMonths}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {completedBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completedBarData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    itemStyle={tooltipItemStyle}
                    labelStyle={tooltipLabelStyle}
                    formatter={(value: number) => [value, 'Serviços concluídos']}
                  />
                  <Bar dataKey="value" fill="hsl(173, 80%, 40%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {isLoading ? 'Carregando dados...' : 'Sem dados suficientes para exibir.'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Principais Serviços Executados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[320px]">
              {topServicesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topServicesData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                    >
                      {topServicesData.map((entry, index) => (
                        <Cell key={`cell-${entry.id}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipContentStyle}
                      itemStyle={tooltipItemStyle}
                      labelStyle={tooltipLabelStyle}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  {isLoading ? 'Carregando dados...' : 'Nenhum serviço encontrado.'}
                </div>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">% do total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topServicesData.length > 0 ? (
                    topServicesData.map((item, index) => {
                      const pct = totalTopServices > 0 ? (item.value / totalTopServices) * 100 : 0;
                      const color = COLORS[index % COLORS.length];
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
                              {item.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.value.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-right">{pct.toFixed(1)}%</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground text-sm">
                        {isLoading ? 'Carregando...' : 'Nenhum dado disponível.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Serviços por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                {servicesByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={servicesByStatus}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        paddingAngle={2}
                      >
                        {servicesByStatus.map((entry, index) => (
                          <Cell key={`status-${entry.name}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {isLoading ? 'Carregando dados...' : 'Nenhum status disponível.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Tarefas por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                {tasksByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tasksByStatus}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        paddingAngle={2}
                      >
                        {tasksByStatus.map((entry, index) => (
                          <Cell key={`task-status-${entry.name}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {isLoading ? 'Carregando dados...' : 'Nenhum status de tarefas disponível.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Tarefas Concluídas por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                {tasksMonthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tasksMonthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                      <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                        formatter={(value: number) => [value, 'Tarefas concluídas']}
                      />
                      <Bar dataKey="value" fill="hsl(215, 85%, 60%)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {isLoading ? 'Carregando dados...' : 'Sem histórico de tarefas concluídas.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">MinIOs Concluídos por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                {miniosChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={miniosChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                      <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                      <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        itemStyle={tooltipItemStyle}
                        labelStyle={tooltipLabelStyle}
                        formatter={(value: number) => [value, 'MinIOs concluídos']}
                      />
                      <Bar dataKey="value" fill="hsl(173, 80%, 40%)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    {isLoading ? 'Carregando dados...' : 'Sem histórico de MinIOs concluídos.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Principais Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {canViewOrderValues ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="h-[320px]">
                  {topClientsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topClientsData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={2}
                        >
                          {topClientsData.map((entry, index) => (
                            <Cell key={`client-${entry.id}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipContentStyle}
                          itemStyle={tooltipItemStyle}
                          labelStyle={tooltipLabelStyle}
                          formatter={(value: number) => [formatCurrency(value), 'Valor faturado']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      {isLoading ? 'Carregando dados...' : 'Nenhum cliente com faturamento registrado.'}
                    </div>
                  )}
                </div>
                <div className="overflow-hidden rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Valor faturado</TableHead>
                        <TableHead className="text-right">% do total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topClientsData.length > 0 ? (
                        topClientsData.map((item, index) => {
                          const pct = totalClientsValue > 0 ? (item.value / totalClientsValue) * 100 : 0;
                          const color = COLORS[index % COLORS.length];
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
                                  {item.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                              <TableCell className="text-right">{pct.toFixed(1)}%</TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground text-sm">
                            {isLoading ? 'Carregando...' : 'Nenhum dado disponível.'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground text-center px-6">
                Dados de faturamento não estão disponíveis para o seu perfil de acesso.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
};

export default DashboardPage;
