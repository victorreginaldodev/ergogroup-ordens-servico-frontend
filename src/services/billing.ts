import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';

export type BillingServiceOrder = {
  id: number;
  numero_os: number;
  cliente_nome: string;
  valor: number;
  forma_pagamento: string | null;
  quantidade_parcelas: number | null;
  cobranca_imediata: string | null;
  faturamento_1: string | null;
  nome_contato_envio_nf: string | null;
  contato_envio_nf: string | null;
  observacao: string | null;
  faturamento: string | null;
  data_faturamento: string | null;
  numero_nf: number | null;
  concluida: string | null;
};

export const useBillingServiceOrders = () => {
  return useQuery({
    queryKey: ['billing-service-orders'],
    queryFn: async () => {
      const { data } = await api.get<BillingServiceOrder[]>('/api/ordens-servico/faturamento/');
      return data ?? [];
    },
  });
};

export type BillingKpis = {
  total_faturado: number;
  total_para_faturar: number;
  total_sem_liberacao: number;
};

export const useBillingKpis = () => {
  return useQuery({
    queryKey: ['billing-kpis'],
    queryFn: async () => {
      const { data } = await api.get<BillingKpis>('/api/financeiro/kpis/');
      return data;
    },
  });
};

export type MiniOsItem = {
  id: number;
  quantidade: number;
  descricao: string;
  data_recebimento: string | null;
  data_inicio: string | null;
  data_termino: string | null;
  status: string;
  faturamento: string | null;
  n_nf: string | null;
  cliente: {
    id: number;
    nome: string;
    tipo_cliente: string | null;
    cliente_ativo: string | null;
  } | null;
  servico: {
    id: number;
    nome: string;
    descricao: string | null;
  } | null;
  profile: {
    id: number;
    username: string;
    role: number;
  } | null;
};

export const useMiniOs = () => {
  return useQuery({
    queryKey: ['mini-os'],
    queryFn: async () => {
      const { data } = await api.get<MiniOsItem[]>('/api/minios/os-rapidas/');
      return data ?? [];
    },
  });
};

export type MiniOsDetail = MiniOsItem;

export const useMiniOsDetail = (id?: number | string) => {
  return useQuery({
    queryKey: ['mini-os-detail', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error('missing id');
      const { data } = await api.get<MiniOsDetail>(`/api/minios/${id}/`);
      return data;
    },
  });
};

export type MiniOsUpdatePayload = {
  faturamento?: string | null;
  n_nf?: string | null;
};

export const useUpdateMiniOs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number | string; payload: MiniOsUpdatePayload }) => {
      const { data } = await api.patch<MiniOsDetail>(`/api/minios/${id}/`, payload);
      return data;
    },
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['mini-os'] }),
        qc.invalidateQueries({ queryKey: ['mini-os-detail', id] }),
      ]);
    },
  });
};
