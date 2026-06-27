import api from '@/services/api';

// ── /api/analise/dados/ ───────────────────────────────────────────────────────

export interface DashboardServiceMonthlyItem {
  mes?: string | number;
  month?: string | number;
  periodo?: string;
  ano?: number;
  total: number;
}

export interface DashboardOrdersSummary {
  total?: number;
  total_concluidas?: number;
  total_nao_concluidas?: number;
  vendas_por_mes?: DashboardServiceMonthlyItem[];
  abertas_por_mes?: DashboardServiceMonthlyItem[];
  concluidas_por_mes?: DashboardServiceMonthlyItem[];
  abertas_mes_atual?: number;
  abertas_mes_anterior?: number;
  concluidas_mes_atual?: number;
  concluidas_mes_anterior?: number;
  em_aberto?: number;
}

export interface DashboardServiceTopItem {
  repositorio_id: number;
  repositorio_nome: string;
  total: number;
}

export interface DashboardServiceStatusItem {
  status: string;
  status_display?: string;
  total: number;
}

export interface DashboardServicesSummary {
  concluidos_ultimos_12_meses?: number;
  concluidos_ultimos_12_meses_total?: number;
  principais_por_quantidade?: DashboardServiceTopItem[];
  por_status?: DashboardServiceStatusItem[];
  concluidos_por_mes?: DashboardServiceMonthlyItem[];
}

export interface DashboardTaskStatusItem {
  status: string;
  status_display?: string;
  total: number;
}

export interface DashboardTasksSummary {
  concluidas_por_mes?: DashboardServiceMonthlyItem[];
  concluidas_ultimos_12_meses_total?: number;
  por_status?: DashboardTaskStatusItem[];
}

export interface DashboardMinioClienteItem {
  cliente_id: number;
  cliente_nome: string;
  total: number;
}

export interface DashboardMinioSummary {
  total?: number;
  total_revisao_cliente?: number;
  criadas_por_mes?: DashboardServiceMonthlyItem[];
  finalizadas_por_mes?: DashboardServiceMonthlyItem[];
  criadas_mes_atual?: number;
  criadas_mes_anterior?: number;
  finalizadas_mes_atual?: number;
  finalizadas_mes_anterior?: number;
  revisoes_por_cliente?: DashboardMinioClienteItem[];
}

export interface DashboardClientItem {
  cliente_id: number;
  cliente_nome: string;
  total_valor_faturado: number;
}

export interface DashboardClientSalesItem {
  cliente_id: number;
  cliente_nome: string;
  total_valor_vendas: number;
}

export interface DashboardClientsSummary {
  mais_faturamento?: DashboardClientItem[];
  mais_vendas?: DashboardClientSalesItem[];
}

export interface DashboardAnalyticsResponse {
  ordens_servico?: DashboardOrdersSummary;
  servicos?: DashboardServicesSummary;
  tarefas?: DashboardTasksSummary;
  minios?: DashboardMinioSummary;
  clientes?: DashboardClientsSummary;
}

export const getDashboardAnalytics = async (): Promise<DashboardAnalyticsResponse> => {
  const { data } = await api.get<DashboardAnalyticsResponse>('/api/analise/dados/');
  return data ?? {};
};

// ── /api/analise/financeiro/kpis/ ─────────────────────────────────────────────

export interface FinanceiroKpisResponse {
  total_faturado: number;
  total_para_faturar: number;
  total_sem_liberacao: number;
}

export const getFinanceiroKpis = async (): Promise<FinanceiroKpisResponse> => {
  const { data } = await api.get<FinanceiroKpisResponse>('/api/analise/financeiro/kpis/');
  return data;
};

// ── /api/analise/produtividade/ ───────────────────────────────────────────────

export interface ProdutividadeMonthlyItem {
  ano: number;
  mes: number;
  total: number;
}

export interface ProdutividadeTecnico {
  tecnico_id: number;
  tecnico_nome: string;
  tarefas_concluidas: number;
  tempo_medio_tarefa_dias: number | null;
  mini_os_concluidas: number;
  tarefas_em_aberto: number;
  mini_os_em_aberto: number;
  tarefas_concluidas_por_mes: ProdutividadeMonthlyItem[];
  mini_os_concluidas_por_mes: ProdutividadeMonthlyItem[];
}

export interface ProdutividadeCancelamento {
  total: number;
  canceladas: number;
  percentual: number | null;
}

export interface OsDistribuicaoTempo {
  ate_7: number;
  de_8_a_15: number;
  de_16_a_30: number;
  de_31_a_60: number;
  acima_60: number;
}

export interface TempoRepositorio {
  repositorio_id: number;
  repositorio_nome: string;
  total_concluidos: number;
  media_dias: number;
}

export interface ProdutividadeResponse {
  tempos_medios: {
    os_criacao_para_encerramento_dias: number | null;
    os_total_com_data: number;
    os_distribuicao_tempo: OsDistribuicaoTempo;
    servicos_inicio_para_fim_dias: number | null;
    tarefa_criacao_para_inicio_dias: number | null;
    tempo_por_repositorio: TempoRepositorio[];
  };
  taxa_cancelamento: {
    tarefas: ProdutividadeCancelamento;
    servicos: ProdutividadeCancelamento;
  };
  por_tecnico: ProdutividadeTecnico[];
}

export const getProdutividade = async (): Promise<ProdutividadeResponse> => {
  const { data } = await api.get<ProdutividadeResponse>('/api/analise/produtividade/');
  return data;
};
