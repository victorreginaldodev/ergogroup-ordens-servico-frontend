import api from '@/services/api';

// ── /api/ordem-servico/ordens/ (lista) ───────────────────────────────────────

export interface OrdemServicoItem {
  id: number;
  cliente: number;
  cliente_detail: { id: number; nome: string } | null;
  status: 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
  status_display: string;
  prioridade: 'baixa' | 'media' | 'alta' | null;
  prioridade_display: string;
  valor: string;
  faturada: boolean;
  numero_nf: number | null;
  liberada_para_faturamento: boolean;
  contrato: boolean;
  criada_em: string;
  data_criacao: string;
  dias_em_aberto: number | null;
  dias_entre_criacao_e_conclusao: number | null;
}

const STATUS_DISPLAY_MAP: Record<string, OrdemServicoItem['status']> = {
  'Aberta': 'aberta',
  'Em Andamento': 'em_andamento',
  'Em andamento': 'em_andamento',
  'Concluída': 'concluida',
  'Concluida': 'concluida',
  'Cancelada': 'cancelada',
};

const normalizeOrdemItem = (dto: any): OrdemServicoItem => ({
  id: dto.id,
  cliente: typeof dto.cliente === 'object' ? dto.cliente?.id : dto.cliente,
  cliente_detail: dto.cliente_detail
    ? { id: dto.cliente_detail.id, nome: dto.cliente_detail.nome }
    : typeof dto.cliente === 'object' && dto.cliente?.nome
    ? { id: dto.cliente.id, nome: dto.cliente.nome }
    : dto.cliente_nome
    ? { id: typeof dto.cliente === 'number' ? dto.cliente : 0, nome: dto.cliente_nome }
    : null,
  status: dto.status ?? STATUS_DISPLAY_MAP[dto.status_display] ?? 'aberta',
  status_display: dto.status_display ?? '',
  prioridade: dto.prioridade ?? null,
  prioridade_display: dto.prioridade_display ?? '',
  valor: dto.valor ?? '0',
  faturada: !!dto.faturada,
  numero_nf: dto.numero_nf ?? null,
  liberada_para_faturamento: !!dto.liberada_para_faturamento,
  contrato: !!dto.contrato,
  criada_em: dto.criada_em ?? dto.data_criacao ?? '',
  data_criacao: dto.data_criacao ?? dto.criada_em ?? '',
  dias_em_aberto: dto.dias_em_aberto ?? null,
  dias_entre_criacao_e_conclusao: dto.dias_entre_criacao_e_conclusao ?? null,
});

export const getOrdensLista = async (): Promise<OrdemServicoItem[]> => {
  const { data } = await api.get<any>('/api/ordem-servico/ordens/', { params: { page_size: 500 } });
  const items = data?.results ?? (Array.isArray(data) ? data : []);
  return items.map(normalizeOrdemItem);
};

// ── /api/ordem-servico/ordens/{id}/ ──────────────────────────────────────────

export interface ClienteDetalheOS {
  id: number;
  nome: string;
  tipo_inscricao: string;
  numero_inscricao: string;
  telefone_institucional: string;
  email_institucional: string;
  ativo: boolean;
}

export interface OrdemServicoDetalhe {
  id: number;
  cliente: number;
  cliente_detail: ClienteDetalheOS;
  criado_por: number | null;
  criado_por_nome: string | null;
  data_criacao: string;
  criada_em: string;
  status: 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
  status_display: string;
  prioridade: 'baixa' | 'media' | 'alta';
  prioridade_display: string;
  valor: string;
  forma_pagamento: string;
  forma_pagamento_display: string;
  quantidade_parcelas: number | null;
  cobranca_imediata: boolean;
  nome_contato_envio_nf: string;
  contato_envio_nf: string;
  contrato: boolean;
  objeto_contrato: string | null;
  contrato_data_inicio: string | null;
  contrato_data_fim: string | null;
  gestor_contrato_nome: string | null;
  gestor_contrato_email: string | null;
  gestor_contrato_telefone: string | null;
  observacao: string | null;
  concluida: boolean;
  faturada: boolean;
  numero_nf: number | null;
  data_faturamento: string | null;
  faturada_por: number | null;
  faturada_por_nome: string | null;
  liberada_para_faturamento: boolean;
  liberada_para_faturamento_em: string | null;
  liberada_para_faturamento_por: number | null;
  liberada_para_faturamento_por_nome: string | null;
  data_atualizacao: string;
  atualizado_por: number | null;
  data_conclusao_os: string | null;
  finalizador_nome: string | null;
  dias_em_aberto: number | null;
  dias_entre_criacao_e_conclusao: number | null;
}

export const getOrdemDetalhe = async (id: number): Promise<OrdemServicoDetalhe> => {
  const { data } = await api.get<OrdemServicoDetalhe>(`/api/ordem-servico/ordens/${id}/`);
  return data;
};

// ── /api/servicos/servicos/?ordem_servico={id} ────────────────────────────────

export interface RepositorioDetalhe {
  id: number;
  nome: string;
  descricao: string | null;
}

export interface ServicoDetalhe {
  id: number;
  ordem_servico: number;
  repositorio: number | null;
  repositorio_detail: RepositorioDetalhe | null;
  repositorio_nome: string | null;
  descricao: string;
  status: 'aberto' | 'em_andamento' | 'concluida' | 'cancelado';
  status_display: string;
  data_inicio: string | null;
  data_termino: string | null;
  data_conclusao: string | null;
  terminado_por: number | null;
  terminado_por_nome: string | null;
  criado_em: string;
  atualizado_em: string;
}

export const getServicosDeOrdem = async (ordemId: number): Promise<ServicoDetalhe[]> => {
  const { data } = await api.get<any>('/api/servicos/servicos/', {
    params: { ordem_servico: ordemId, page_size: 200 },
  });
  const results = data?.results ?? (Array.isArray(data) ? data : []);
  return results as ServicoDetalhe[];
};

export const getServicoDetalhe = async (id: number): Promise<ServicoDetalhe> => {
  const { data } = await api.get<ServicoDetalhe>(`/api/servicos/servicos/${id}/`);
  return data;
};

// ── /api/tarefas/tarefas/?servico={id} ───────────────────────────────────────

export interface TarefaDetalhe {
  id: number;
  servico: number;
  responsavel: number;
  responsavel_nome: string;
  cliente_nome: string;
  repositorio_nome: string | null;
  descricao: string | null;
  status: 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
  status_display: string;
  data_inicio: string | null;
  data_termino: string | null;
  criada_em: string;
  atualizado_em: string;
}

export const getTarefasDeServico = async (servicoId: number): Promise<TarefaDetalhe[]> => {
  const { data } = await api.get<any>('/api/tarefas/tarefas/', {
    params: { servico: servicoId, page_size: 200 },
  });
  const results = data?.results ?? (Array.isArray(data) ? data : []);
  return results as TarefaDetalhe[];
};

// ── Mutations: Tarefa ─────────────────────────────────────────────────────────

export interface CreateTarefaPayload {
  responsavel: number;
  servico: number;
  descricao: string;
}

export interface UpdateTarefaPayload {
  responsavel?: number;
  descricao?: string;
  status?: string;
}

export const createTarefa = async (payload: CreateTarefaPayload): Promise<TarefaDetalhe> => {
  const { data } = await api.post<TarefaDetalhe>('/api/tarefas/tarefas/', payload);
  return data;
};

export const updateTarefa = async (id: number, payload: UpdateTarefaPayload): Promise<TarefaDetalhe> => {
  const { data } = await api.patch<TarefaDetalhe>(`/api/tarefas/tarefas/${id}/`, payload);
  return data;
};

export const deleteTarefa = async (id: number): Promise<void> => {
  await api.delete(`/api/tarefas/tarefas/${id}/`);
};

// ── /api/auditoria/registros/ordens/{id}/timeline/ ───────────────────────────

export interface RegistroAuditoria {
  id: number;
  entidade: 'ordem_servico' | 'servico' | 'tarefa' | 'mini_os';
  entidade_display: string;
  objeto_id: number;
  objeto_repr: string;
  acao: string;
  acao_display: string;
  origem: 'api' | 'admin' | 'sistema' | 'migracao';
  origem_display: string;
  motivo: string | null;
  usuario: number | null;
  usuario_nome: string | null;
  criado_em: string;
  alteracoes: Record<string, { antes: unknown; depois: unknown }>;
  snapshot: Record<string, unknown>;
  ordem_servico_id: number | null;
  servico_id: number | null;
  tarefa_id: number | null;
  mini_os_id: number | null;
}

export const getAuditoriaTimeline = async (ordemId: number): Promise<RegistroAuditoria[]> => {
  const { data } = await api.get<any>(
    `/api/auditoria/registros/ordens/${ordemId}/timeline/`,
  );
  return (data?.results ?? (Array.isArray(data) ? data : [])) as RegistroAuditoria[];
};
