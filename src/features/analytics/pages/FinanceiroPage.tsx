import { useMemo } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, AlertCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUserRole } from '@/hooks/useUserRole';
import { useFinanceiroKpis, useDashboardAnalytics, useProdutividade } from '../hooks';
import { formatCurrency, toChartSeries } from '../utils';
import { KpiCard, KpiCardSkeleton } from '../components/KpiCard';
import { MonthlyBarChart } from '../components/MonthlyBarChart';
import { DonutTableCard } from '../components/DonutTableCard';

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">{children}</p>
);

const FinanceiroPage = () => {
  const { data: kpis, isLoading: kpisLoading, isError: kpisError } = useFinanceiroKpis();
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics();
  const { data: produtividade, isLoading: prodLoading } = useProdutividade();
  const { canViewOrderValues } = useUserRole();

  const isLoading = kpisLoading || analyticsLoading || prodLoading;

  const salesChartData = useMemo(
    () => toChartSeries(analytics?.ordens_servico?.vendas_por_mes ?? []),
    [analytics],
  );

  const topClientsFaturamento = useMemo(
    () =>
      (analytics?.clientes?.mais_faturamento ?? [])
        .slice()
        .sort((a, b) => (b.total_valor_faturado ?? 0) - (a.total_valor_faturado ?? 0))
        .slice(0, 8)
        .map((item) => ({
          id: item.cliente_id,
          name: item.cliente_nome,
          value: Number(item.total_valor_faturado ?? 0),
        })),
    [analytics],
  );

  const topClientesVendas = useMemo(
    () =>
      (analytics?.clientes?.mais_vendas ?? [])
        .slice()
        .sort((a, b) => (b.total_valor_vendas ?? 0) - (a.total_valor_vendas ?? 0))
        .slice(0, 10)
        .map((item) => ({
          id: item.cliente_id,
          name: item.cliente_nome,
          value: Number(item.total_valor_vendas ?? 0),
        })),
    [analytics],
  );

  const cancelamentoTarefas = produtividade?.taxa_cancelamento?.tarefas;
  const cancelamentoServicos = produtividade?.taxa_cancelamento?.servicos;

  return (
    <div className="space-y-8 animate-fade-in">
      {kpisError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar KPIs</AlertTitle>
          <AlertDescription>
            Não foi possível recuperar os indicadores financeiros. Verifique suas permissões.
          </AlertDescription>
        </Alert>
      )}

      <section className="space-y-4">
      <SectionLabel>Indicadores</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis ? (
          <>
            <KpiCard
              title="Total Faturado"
              value={canViewOrderValues ? formatCurrency(kpis.total_faturado) : '—'}
              changeType="positive"
              icon={DollarSign}
            />
            <KpiCard
              title="A Faturar"
              value={canViewOrderValues ? formatCurrency(kpis.total_para_faturar) : '—'}
              changeType="neutral"
              icon={TrendingUp}
            />
            <KpiCard
              title="Sem Liberação para Faturamento"
              value={canViewOrderValues ? formatCurrency(kpis.total_sem_liberacao) : '—'}
              changeType="negative"
              icon={AlertTriangle}
            />
          </>
        ) : (
          Array.from({ length: 3 }).map((_, i) => <KpiCardSkeleton key={i} index={i} />)
        )}
      </div>

      </section>

      {/* Vendas por Mês */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Vendas por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyBarChart
            data={salesChartData}
            barColor="hsl(215, 85%, 60%)"
            tooltipLabel="Total de vendas"
            valueFormatter={canViewOrderValues ? formatCurrency : undefined}
            hideYAxis={!canViewOrderValues}
            isLoading={isLoading}
            emptyMessage="Sem histórico de vendas."
          />
        </CardContent>
      </Card>

      {/* Principais Clientes — Faturamento */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Principais Clientes por Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <DonutTableCard
            data={topClientsFaturamento}
            isLoading={isLoading}
            showValue={canViewOrderValues}
            valueLabel="Valor faturado"
            valueFormatter={formatCurrency}
            emptyMessage="Nenhum cliente com faturamento registrado."
          />
        </CardContent>
      </Card>

      {/* Clientes com Mais Vendas */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Clientes com Mais Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <DonutTableCard
            data={topClientesVendas}
            isLoading={isLoading}
            showValue={canViewOrderValues}
            valueLabel="Valor vendido"
            valueFormatter={formatCurrency}
            emptyMessage="Nenhum cliente com vendas registradas."
          />
        </CardContent>
      </Card>
      {/* Taxa de Cancelamento */}
      <section className="space-y-4">
        <SectionLabel>Taxa de Cancelamento</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cancelamentoTarefas != null ? (
            <KpiCard
              title="Cancelamento de Tarefas"
              value={cancelamentoTarefas.percentual != null ? `${cancelamentoTarefas.percentual.toFixed(1)}%` : '—'}
              change={`${cancelamentoTarefas.canceladas} de ${cancelamentoTarefas.total} tarefas`}
              changeType={
                cancelamentoTarefas.percentual != null && cancelamentoTarefas.percentual > 15
                  ? 'negative'
                  : 'neutral'
              }
              icon={XCircle}
            />
          ) : (
            <KpiCardSkeleton index={0} />
          )}
          {cancelamentoServicos != null ? (
            <KpiCard
              title="Cancelamento de Serviços"
              value={cancelamentoServicos.percentual != null ? `${cancelamentoServicos.percentual.toFixed(1)}%` : '—'}
              change={`${cancelamentoServicos.canceladas} de ${cancelamentoServicos.total} serviços`}
              changeType={
                cancelamentoServicos.percentual != null && cancelamentoServicos.percentual > 15
                  ? 'negative'
                  : 'neutral'
              }
              icon={XCircle}
            />
          ) : (
            <KpiCardSkeleton index={1} />
          )}
        </div>
      </section>
    </div>
  );
};

export default FinanceiroPage;
