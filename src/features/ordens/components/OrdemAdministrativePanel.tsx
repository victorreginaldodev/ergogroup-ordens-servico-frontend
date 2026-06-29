import {
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  FileText,
  History,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate, formatDateTime } from '../utils';
import { OrdemAuditoriaTimeline } from './OrdemAuditoriaTimeline';
import type { OrdemServicoDetalhe } from '../services';

interface OrdemAdministrativePanelProps {
  ordem: OrdemServicoDetalhe;
}

interface InfoFieldProps {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}

const BILLING_STATUS_STYLE: Record<string, string> = {
  faturada: 'border-green-200 bg-green-50 text-green-700',
  liberada: 'border-amber-200 bg-amber-50 text-amber-700',
  pendente: 'border-slate-200 bg-slate-100 text-slate-600',
};

function InfoField({ label, value, wide }: InfoFieldProps) {
  return (
    <div className={cn('min-w-0 py-3', wide && 'sm:col-span-2')}>
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/70">
        {label}
      </p>
      <div className="mt-1 break-words text-sm font-bold text-foreground">
        {value || '—'}
      </div>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
      {children}
    </div>
  );
}

function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold',
        BILLING_STATUS_STYLE[status] ?? 'border-border bg-muted text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'h-[7px] w-[7px] rounded-full',
          status === 'faturada' && 'bg-green-500',
          status === 'liberada' && 'bg-amber-400',
          status === 'pendente' && 'bg-slate-400',
        )}
      />
      {label}
    </span>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[154px] flex-col items-center justify-center text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-muted">
        <ClipboardList className="h-5 w-5 text-muted-foreground/60" />
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function DadosTab({ ordem }: OrdemAdministrativePanelProps) {
  return (
    <div>
      <FieldGrid>
        <InfoField label="Criado por" value={ordem.criado_por_nome} />
        <InfoField label="Registrado em" value={formatDateTime(ordem.criada_em)} />
        <InfoField label="Data de criação" value={formatDate(ordem.data_criacao)} />
        <InfoField label="Última atualização" value={formatDateTime(ordem.data_atualizacao)} />
        <InfoField label="Prioridade" value={ordem.prioridade_display} />
        <InfoField
          label="Conclusão da OS"
          value={
            ordem.data_conclusao_os
              ? `${formatDate(ordem.data_conclusao_os)}${ordem.finalizador_nome ? ` por ${ordem.finalizador_nome}` : ''}`
              : '—'
          }
        />
      </FieldGrid>
    </div>
  );
}

function ContratoTab({ ordem }: OrdemAdministrativePanelProps) {
  if (!ordem.contrato) {
    return (
      <EmptyState
        title="OS sem contrato vinculado"
        description="Os dados contratuais não foram informados para esta ordem."
      />
    );
  }

  const vigencia =
    ordem.contrato_data_inicio || ordem.contrato_data_fim
      ? `${formatDate(ordem.contrato_data_inicio) ?? '—'} → ${formatDate(ordem.contrato_data_fim) ?? '—'}`
      : '—';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/70">
            Contrato ativo
          </p>
          <p className="mt-1 text-base font-bold text-foreground">{vigencia}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
          <span className="h-[7px] w-[7px] rounded-full bg-green-500" />
          Vigente
        </span>
      </div>

      <FieldGrid>
        <InfoField label="Gestor" value={ordem.gestor_contrato_nome} />
        <InfoField label="E-mail do gestor" value={ordem.gestor_contrato_email} />
        <InfoField label="Telefone do gestor" value={ordem.gestor_contrato_telefone} />
        <InfoField label="Objeto" value={ordem.objeto_contrato} wide />
      </FieldGrid>
    </div>
  );
}

function CobrancaTab({ ordem }: OrdemAdministrativePanelProps) {
  const faturamentoKey = ordem.faturada
    ? 'faturada'
    : ordem.liberada_para_faturamento
      ? 'liberada'
      : 'pendente';

  const faturamentoLabel = ordem.faturada
    ? 'Faturada'
    : ordem.liberada_para_faturamento
      ? 'Liberada para faturamento'
      : 'Não faturada';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/70">
            Valor total
          </p>
          <p className="mt-1 text-[28px] font-bold leading-none tracking-tight text-foreground">
            {formatCurrency(ordem.valor)}
          </p>
        </div>
        <StatusPill status={faturamentoKey} label={faturamentoLabel} />
      </div>

      <FieldGrid>
        <InfoField
          label={ordem.cliente_detail?.tipo_inscricao?.toUpperCase() ?? 'Documento'}
          value={ordem.cliente_detail?.numero_inscricao}
        />
        <InfoField label="Forma de pagamento" value={ordem.forma_pagamento_display} />
        <InfoField
          label="Parcelas"
          value={ordem.quantidade_parcelas ? `${ordem.quantidade_parcelas}x` : '—'}
        />
        <InfoField label="Cobrança imediata" value={ordem.cobranca_imediata ? 'Sim' : 'Não'} />
        <InfoField
          label="Liberação para faturamento"
          value={
            ordem.liberada_para_faturamento
              ? formatDateTime(ordem.liberada_para_faturamento_em) ?? 'Sim'
              : 'Não'
          }
        />
        <InfoField label="Liberada por" value={ordem.liberada_para_faturamento_por_nome} />
        <InfoField
          label="Faturamento"
          value={
            ordem.faturada
              ? `Sim${ordem.data_faturamento ? ` — ${formatDate(ordem.data_faturamento)}` : ''}`
              : 'Não'
          }
        />
        <InfoField label="Número NF" value={ordem.numero_nf ? String(ordem.numero_nf) : null} />
        <InfoField label="Faturada por" value={ordem.faturada_por_nome} />
        <InfoField
          label="Contato para envio de NF"
          value={[ordem.nome_contato_envio_nf, ordem.contato_envio_nf].filter(Boolean).join(' · ') || null}
          wide
        />
      </FieldGrid>

      {ordem.observacao && (
        <FieldGrid>
          <InfoField label="Observação de cobrança" value={ordem.observacao} wide />
        </FieldGrid>
      )}
    </div>
  );
}

const tabTriggerClass =
  'h-9 rounded-[8px] px-3 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-none';

export function OrdemAdministrativePanel({ ordem }: OrdemAdministrativePanelProps) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
      <Tabs defaultValue="dados">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-[22px] py-3">
          <div>
            <h2 className="text-[15px] font-bold leading-none">Dados da OS</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Contrato, cobrança e histórico administrativo
            </p>
          </div>
          <TabsList className="h-auto rounded-[10px] border border-border bg-card p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <TabsTrigger value="dados" className={tabTriggerClass}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="contrato" className={tabTriggerClass}>
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              Contrato
            </TabsTrigger>
            <TabsTrigger value="cobranca" className={tabTriggerClass}>
              <CircleDollarSign className="mr-1.5 h-3.5 w-3.5" />
              Cobrança
            </TabsTrigger>
            <TabsTrigger value="historico" className={tabTriggerClass}>
              <History className="mr-1.5 h-3.5 w-3.5" />
              Histórico
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dados" className="m-0 px-[22px] py-4">
          <DadosTab ordem={ordem} />
        </TabsContent>
        <TabsContent value="contrato" className="m-0 px-[22px] py-4">
          <ContratoTab ordem={ordem} />
        </TabsContent>
        <TabsContent value="cobranca" className="m-0 px-[22px] py-4">
          <CobrancaTab ordem={ordem} />
        </TabsContent>
        <TabsContent value="historico" className="m-0 px-[22px] pb-4 pt-2">
          <OrdemAuditoriaTimeline ordemId={ordem.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
