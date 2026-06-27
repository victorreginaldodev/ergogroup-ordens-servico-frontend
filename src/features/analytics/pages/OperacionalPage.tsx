import { useMemo, useState } from 'react';
import { ClipboardList, CheckCircle, Clock, AlertCircle, CheckSquare, Layers, Inbox, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardAnalytics, useProdutividade } from '../hooks';
import { toChartSeries } from '../utils';
import { STATUS_COLORS } from '../constants';
import { KpiCard, KpiCardSkeleton } from '../components/KpiCard';
import { StatusPieChart } from '../components/StatusPieChart';
import { DonutTableCard } from '../components/DonutTableCard';
import { DualBarChart } from '../components/DualBarChart';
import { HorizontalBarChart } from '../components/HorizontalBarChart';


const formatDias = (value: number | null | undefined) =>
  value != null ? `${value} dias` : '—';

const deltaPct = (atual: number, anterior: number) =>
  anterior === 0 ? (atual > 0 ? 100 : 0) : Math.round(((atual - anterior) / anterior) * 100);

const STATUS_COLOR_MAP: Record<string, string> = {
  'Aberta':       'hsl(0, 84%, 60%)',
  'Aberto':       'hsl(0, 84%, 60%)',
  'Em Andamento': 'hsl(45, 93%, 47%)',
  'Concluída':    'hsl(142, 76%, 36%)',
  'Concluído':    'hsl(142, 76%, 36%)',
  'Cancelada':    'hsl(220, 14%, 60%)',
  'Cancelado':    'hsl(220, 14%, 60%)',
};

const OperacionalPage = () => {
  const { data: analytics, isLoading: analyticsLoading, isError: analyticsError } = useDashboardAnalytics();
  const { data: produtividade, isLoading: prodLoading, isError: prodError } = useProdutividade();

  const isLoading = analyticsLoading || prodLoading;
  const [selectedTecnicoId, setSelectedTecnicoId] = useState<string | null>(null);

  // ── OS KPIs ──────────────────────────────────────────────────────────────────
  const kpisOS = useMemo(() => {
    const os = analytics?.ordens_servico;
    if (!os) return null;
    const abertasMes = Number(os.abertas_mes_atual ?? 0);
    const abertasMesAnt = Number(os.abertas_mes_anterior ?? 0);
    const concluidasMes = Number(os.concluidas_mes_atual ?? 0);
    const concluidasMesAnt = Number(os.concluidas_mes_anterior ?? 0);
    const deltaAbertas = deltaPct(abertasMes, abertasMesAnt);
    const deltaConcluidas = deltaPct(concluidasMes, concluidasMesAnt);
    return {
      total: Number(os.total ?? 0),
      totalConcluidas: Number(os.total_concluidas ?? 0),
      emAberto: Number(os.em_aberto ?? 0),
      abertasMes,
      concluidasMes,
      deltaAbertas,
      deltaConcluidas,
    };
  }, [analytics]);

  // ── Fluxo mensal (abertas vs concluídas) ─────────────────────────────────────
  const fluxoMensalData = useMemo(() => {
    const abertas = toChartSeries(analytics?.ordens_servico?.abertas_por_mes ?? []);
    const concluidas = toChartSeries(analytics?.ordens_servico?.concluidas_por_mes ?? []);
    return abertas.map((item, i) => ({
      name: item.name,
      Abertas: item.value,
      Concluídas: concluidas[i]?.value ?? 0,
    }));
  }, [analytics]);

  const topServicesData = useMemo(() => {
    const all = (analytics?.servicos?.principais_por_quantidade ?? [])
      .map((item) => ({ id: item.repositorio_id, name: item.repositorio_nome, value: Number(item.total ?? 0) }))
      .sort((a, b) => b.value - a.value);

    const TOP_N = 8;
    const top = all.slice(0, TOP_N);
    const rest = all.slice(TOP_N);
    if (!rest.length) return top;

    const demaisTotal = rest.reduce((sum, item) => sum + item.value, 0);
    return [
      ...top,
      { id: -1, name: `Demais (${rest.length} serviço${rest.length === 1 ? '' : 's'})`, value: demaisTotal },
    ];
  }, [analytics]);

  const servicesByStatus = useMemo(
    () =>
      (analytics?.servicos?.por_status ?? []).map((item) => ({
        name: item.status_display ?? item.status,
        value: Number(item.total ?? 0),
      })),
    [analytics],
  );

  // ── Tarefas e MinIOs ─────────────────────────────────────────────────────────
  const tasksByStatus = useMemo(
    () =>
      (analytics?.tarefas?.por_status ?? []).map((item) => ({
        name: item.status_display ?? item.status,
        value: Number(item.total ?? 0),
      })),
    [analytics],
  );

  const fluxoMiniosData = useMemo(() => {
    const criadas = toChartSeries(analytics?.minios?.criadas_por_mes ?? []);
    const finalizadas = toChartSeries(analytics?.minios?.finalizadas_por_mes ?? []);
    return criadas.map((item, i) => ({
      name: item.name,
      Criadas: item.value,
      Finalizadas: finalizadas[i]?.value ?? 0,
    }));
  }, [analytics]);

  const miniosRevisoesPorCliente = useMemo(
    () =>
      (analytics?.minios?.revisoes_por_cliente ?? []).map((item) => ({
        id: item.cliente_id,
        name: item.cliente_nome,
        value: Number(item.total ?? 0),
      })),
    [analytics],
  );

  const miniosRevisaoTotalPct = useMemo(() => {
    const total = Number(analytics?.minios?.total ?? 0);
    const revisoes = Number(analytics?.minios?.total_revisao_cliente ?? 0);
    if (total <= 0) return 0;
    return Math.min(Math.max((revisoes / total) * 100, 0), 100);
  }, [analytics]);

  // ── Execução técnica ─────────────────────────────────────────────────────────
  const tecnicoSelecionado = useMemo(() => {
    const lista = produtividade?.por_tecnico ?? [];
    if (!lista.length) return null;
    return lista.find((t) => String(t.tecnico_id) === selectedTecnicoId) ?? lista[0];
  }, [produtividade, selectedTecnicoId]);

  const tecnicoChartData = useMemo(() => {
    if (!tecnicoSelecionado) return [];
    const tarefas = toChartSeries(tecnicoSelecionado.tarefas_concluidas_por_mes);
    const minios  = toChartSeries(tecnicoSelecionado.mini_os_concluidas_por_mes);
    return tarefas.map((item, i) => ({
      name: item.name,
      Tarefas: item.value,
      'Mini-OS': minios[i]?.value ?? 0,
    }));
  }, [tecnicoSelecionado]);

  const kpiOsTempo = useMemo(() => {
    const t = produtividade?.tempos_medios;
    if (!t) return null;
    return {
      media: t.os_criacao_para_encerramento_dias,
      total: t.os_total_com_data,
    };
  }, [produtividade]);

  const osDistribuicao = useMemo(() => {
    const d = produtividade?.tempos_medios?.os_distribuicao_tempo;
    if (!d) return null;
    const total = d.ate_7 + d.de_8_a_15 + d.de_16_a_30 + d.de_31_a_60 + d.acima_60;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return {
      total,
      faixas: [
        { label: '≤ 7 dias',     count: d.ate_7,       pct: pct(d.ate_7),       color: 'hsl(142, 76%, 36%)' },
        { label: '8 – 15 dias',  count: d.de_8_a_15,   pct: pct(d.de_8_a_15),   color: 'hsl(173, 80%, 40%)' },
        { label: '16 – 30 dias', count: d.de_16_a_30,  pct: pct(d.de_16_a_30),  color: 'hsl(45, 93%, 47%)'  },
        { label: '31 – 60 dias', count: d.de_31_a_60,  pct: pct(d.de_31_a_60),  color: 'hsl(25, 95%, 53%)'  },
        { label: '> 60 dias',    count: d.acima_60,    pct: pct(d.acima_60),    color: 'hsl(0, 84%, 60%)'   },
      ],
    };
  }, [produtividade]);


  return (
    <div className="space-y-6 animate-fade-in">
      {(analyticsError || prodError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dados</AlertTitle>
          <AlertDescription>
            Não foi possível recuperar os indicadores operacionais. Tente novamente em instantes.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpisOS ? (
          <>
            <KpiCard
              title="Total de Ordens de Serviço"
              value={kpisOS.total.toLocaleString('pt-BR')}
              change={`${kpisOS.abertasMes} abertas este mês (${kpisOS.deltaAbertas >= 0 ? '+' : ''}${kpisOS.deltaAbertas}% vs anterior)`}
              changeType={kpisOS.deltaAbertas <= 0 ? 'positive' : 'negative'}
              icon={ClipboardList}
            />
            <KpiCard
              title="Total Concluídas"
              value={kpisOS.totalConcluidas.toLocaleString('pt-BR')}
              change={`${kpisOS.concluidasMes} concluídas este mês (${kpisOS.deltaConcluidas >= 0 ? '+' : ''}${kpisOS.deltaConcluidas}% vs anterior)`}
              changeType={kpisOS.deltaConcluidas >= 0 ? 'positive' : 'negative'}
              icon={CheckCircle}
            />
            <KpiCard
              title="Em Andamento"
              value={kpisOS.emAberto.toLocaleString('pt-BR')}
              change="backlog atual em aberto"
              changeType="neutral"
              icon={Clock}
            />
          </>
        ) : (
          Array.from({ length: 3 }).map((_, i) => <KpiCardSkeleton key={i} index={i} />)
        )}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Fluxo Mensal — Abertas vs Concluídas</CardTitle>
        </CardHeader>
        <CardContent>
          <DualBarChart
            data={fluxoMensalData}
            series={[
              { key: 'Abertas',    name: 'Abertas',    color: 'hsl(215, 85%, 60%)' },
              { key: 'Concluídas', name: 'Concluídas', color: 'hsl(173, 80%, 40%)' },
            ]}
            isLoading={isLoading}
            emptyMessage="Sem histórico de OS para exibir."
          />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Principais Serviços Executados</CardTitle>
        </CardHeader>
        <CardContent>
          <DonutTableCard
            data={topServicesData}
            isLoading={isLoading}
            valueLabel="Qtd"
            valueFormatter={(v) => v.toLocaleString('pt-BR')}
            emptyMessage="Nenhum serviço encontrado."
          />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Serviços por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart
              data={servicesByStatus}
              colors={STATUS_COLORS}
              colorMap={STATUS_COLOR_MAP}
              showLegend
              isLoading={isLoading}
              emptyMessage="Nenhum status disponível."
            />
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Tarefas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart
              data={tasksByStatus}
              colors={STATUS_COLORS}
              colorMap={STATUS_COLOR_MAP}
              showLegend
              isLoading={isLoading}
              emptyMessage="Nenhum status de tarefas disponível."
            />
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Fluxo Mensal de MinIOs — Criadas vs Finalizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <DualBarChart
            data={fluxoMiniosData}
            series={[
              { key: 'Criadas',     name: 'Criadas',     color: 'hsl(215, 85%, 60%)' },
              { key: 'Finalizadas', name: 'Finalizadas', color: 'hsl(173, 80%, 40%)' },
            ]}
            isLoading={isLoading}
            emptyMessage="Sem histórico de MinIOs para exibir."
          />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Clientes com Mais Revisões</CardTitle>
          <p className="text-sm text-muted-foreground">
            Taxa geral de revisão: {miniosRevisaoTotalPct.toFixed(1)}% dos MinIOs
          </p>
        </CardHeader>
        <CardContent>
          <DonutTableCard
            data={miniosRevisoesPorCliente}
            isLoading={isLoading}
            valueLabel="Revisões"
            valueFormatter={(v) => v.toLocaleString('pt-BR')}
            emptyMessage="Nenhum MinIO com revisão do cliente encontrado."
          />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tempo de Encerramento de OS</CardTitle>
          {kpiOsTempo && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-1 text-sm text-muted-foreground">
              <span>
                Média:{' '}
                <span className="font-semibold text-foreground">{formatDias(kpiOsTempo.media)}</span>
              </span>
              <span>
                {kpiOsTempo.total.toLocaleString('pt-BR')} OS encerradas
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {osDistribuicao ? (
            <div className="space-y-4 py-2">
              {osDistribuicao.faixas.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium tabular-nums">
                      {item.count.toLocaleString('pt-BR')} OS · {item.pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              {isLoading ? 'Carregando...' : 'Sem dados disponíveis.'}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tempo Médio de Conclusão por Serviço</CardTitle>
          <p className="text-sm text-muted-foreground">Histórico completo · do mais lento ao mais rápido</p>
        </CardHeader>
        <CardContent>
          <HorizontalBarChart
            data={(produtividade?.tempos_medios?.tempo_por_repositorio ?? []).map((r) => ({
              name: r.repositorio_nome,
              value: r.media_dias,
              sub: `${r.total_concluidos} concluídos`,
            }))}
            barColor="hsl(215, 85%, 60%)"
            tooltipLabel="Média (dias)"
            valueFormatter={(v) => `${v} dias`}
            isLoading={isLoading}
            emptyMessage="Nenhum serviço com dados de duração disponíveis."
          />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold">Produtividade por Técnico</CardTitle>
            {(produtividade?.por_tecnico?.length ?? 0) > 0 && (
              <Select
                value={selectedTecnicoId ?? String(produtividade!.por_tecnico[0].tecnico_id)}
                onValueChange={setSelectedTecnicoId}
              >
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Selecione um técnico" />
                </SelectTrigger>
                <SelectContent>
                  {produtividade!.por_tecnico.map((t) => (
                    <SelectItem key={t.tecnico_id} value={String(t.tecnico_id)}>
                      {t.tecnico_nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {tecnicoSelecionado ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
                    <CheckSquare className="h-3.5 w-3.5" />
                    Tarefas Concluídas
                  </div>
                  <span className="text-2xl font-bold tabular-nums">
                    {tecnicoSelecionado.tarefas_concluidas.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
                    <Layers className="h-3.5 w-3.5" />
                    Mini-OS Concluídas
                  </div>
                  <span className="text-2xl font-bold tabular-nums">
                    {tecnicoSelecionado.mini_os_concluidas.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
                    <Inbox className="h-3.5 w-3.5" />
                    Em Aberto
                  </div>
                  <span className="text-2xl font-bold tabular-nums">
                    {(tecnicoSelecionado.tarefas_em_aberto + tecnicoSelecionado.mini_os_em_aberto).toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {tecnicoSelecionado.tarefas_em_aberto} tarefas · {tecnicoSelecionado.mini_os_em_aberto} mini-OS
                  </span>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
                    <Timer className="h-3.5 w-3.5" />
                    Tempo Médio / Tarefa
                  </div>
                  <span className="text-2xl font-bold tabular-nums">
                    {formatDias(tecnicoSelecionado.tempo_medio_tarefa_dias)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Evolução mensal — últimos 12 meses</p>
                <DualBarChart
                  data={tecnicoChartData}
                  series={[
                    { key: 'Tarefas',  name: 'Tarefas',  color: 'hsl(215, 85%, 60%)' },
                    { key: 'Mini-OS',  name: 'Mini-OS',  color: 'hsl(173, 80%, 40%)' },
                  ]}
                  isLoading={isLoading}
                  emptyMessage="Sem histórico mensal para este técnico."
                />
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              {isLoading ? 'Carregando...' : 'Nenhum dado disponível.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OperacionalPage;
