import { cn } from '@/lib/utils';
import { MoneyValue } from '@/components/common/MoneyValue';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate, formatDateTime, formatCurrency } from '../utils';
import { OrdemAuditoriaTimeline } from './OrdemAuditoriaTimeline';
import type { OrdemServicoDetalhe } from '../services';

function Field({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn('space-y-1', wide && 'col-span-2')}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value ?? '—'}</p>
    </div>
  );
}

const FATURAMENTO_BADGE: Record<string, string> = {
  faturada: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  liberada:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pendente: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

interface OrdemInfoCardsProps {
  ordem: OrdemServicoDetalhe;
}

export function OrdemInfoCards({ ordem }: OrdemInfoCardsProps) {
  const faturamentoKey = ordem.faturada ? 'faturada' : ordem.liberada_para_faturamento ? 'liberada' : 'pendente';
  const faturamentoLabel = ordem.faturada ? 'Faturada' : ordem.liberada_para_faturamento ? 'Liberada para fat.' : 'Não faturada';

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-0">
        <Tabs defaultValue="dados">
          <TabsList className="w-full justify-start rounded-none rounded-t-xl border-b border-border bg-transparent px-4 pt-1 h-auto gap-0">
            <TabsTrigger
              value="dados"
              className="rounded-none border-b-2 border-transparent px-4 pb-2.5 pt-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
            >
              Dados da OS
            </TabsTrigger>
            <TabsTrigger
              value="cobranca"
              className="rounded-none border-b-2 border-transparent px-4 pb-2.5 pt-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
            >
              Cobrança
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="rounded-none border-b-2 border-transparent px-4 pb-2.5 pt-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
            >
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* ── Dados da OS ── */}
          <TabsContent value="dados" className="m-0 p-4 space-y-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Criado por"          value={ordem.criado_por_nome} />
              <Field label="Data de criação"     value={formatDate(ordem.data_criacao)} />
              <Field label="Registrado em"       value={formatDateTime(ordem.criada_em)} />
              <Field label="Última atualização"  value={formatDateTime(ordem.data_atualizacao)} />
              <Field label="Prioridade"          value={ordem.prioridade_display} />
            </div>

            {ordem.contrato && (
              <>
                <Separator />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contrato
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field
                    label="Vigência"
                    value={
                      ordem.contrato_data_inicio && ordem.contrato_data_fim
                        ? `${formatDate(ordem.contrato_data_inicio)} → ${formatDate(ordem.contrato_data_fim)}`
                        : null
                    }
                  />
                  {ordem.gestor_contrato_nome && (
                    <Field label="Gestor" value={ordem.gestor_contrato_nome} />
                  )}
                  {ordem.gestor_contrato_email && (
                    <Field label="E-mail do gestor" value={ordem.gestor_contrato_email} />
                  )}
                  {ordem.gestor_contrato_telefone && (
                    <Field label="Telefone do gestor" value={ordem.gestor_contrato_telefone} />
                  )}
                  {ordem.objeto_contrato && (
                    <Field label="Objeto" value={ordem.objeto_contrato} wide />
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Cobrança ── */}
          <TabsContent value="cobranca" className="m-0 p-4 space-y-4">
            {/* Valor em destaque */}
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Valor total</p>
                <p className="text-[28px] font-bold leading-none tracking-tight">
                  <MoneyValue value={ordem.valor} formatter={formatCurrency} />
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  FATURAMENTO_BADGE[faturamentoKey],
                )}
              >
                {faturamentoLabel}
              </span>
            </div>

            {ordem.observacao && (
              <>
                <Separator />
                <Field label="Observação" value={ordem.observacao} wide />
              </>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field
                label={ordem.cliente_detail?.tipo_inscricao?.toUpperCase() ?? 'CNPJ'}
                value={ordem.cliente_detail?.numero_inscricao ?? 'Não informado'}
              />
              <Field label="Forma de pagamento" value={ordem.forma_pagamento_display} />
              {ordem.quantidade_parcelas && (
                <Field label="Parcelas" value={`${ordem.quantidade_parcelas}x`} />
              )}
              <Field
                label="Cobrança imediata"
                value={ordem.cobranca_imediata ? 'Sim' : 'Não'}
              />
              <Field
                label="Lib. para faturamento"
                value={
                  ordem.liberada_para_faturamento
                    ? formatDateTime(ordem.liberada_para_faturamento_em) ?? 'Sim'
                    : 'Não'
                }
              />
              {ordem.liberada_para_faturamento_por_nome && (
                <Field label="Liberada por" value={ordem.liberada_para_faturamento_por_nome} />
              )}
              <Field
                label="Faturada"
                value={
                  ordem.faturada
                    ? `Sim${ordem.data_faturamento ? ` — ${formatDate(ordem.data_faturamento)}` : ''}`
                    : 'Não'
                }
              />
              {ordem.numero_nf && (
                <Field label="Número NF" value={String(ordem.numero_nf)} />
              )}
              {ordem.faturada_por_nome && (
                <Field label="Faturada por" value={ordem.faturada_por_nome} />
              )}
              {ordem.data_conclusao_os && (
                <Field label="Concluída em" value={formatDate(ordem.data_conclusao_os)} />
              )}
              {ordem.finalizador_nome && (
                <Field label="Finalizada por" value={ordem.finalizador_nome} />
              )}
            </div>

            {(ordem.nome_contato_envio_nf || ordem.contato_envio_nf) && (
              <>
                <Separator />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contato para envio de NF
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {ordem.nome_contato_envio_nf && (
                    <Field label="Nome" value={ordem.nome_contato_envio_nf} />
                  )}
                  {ordem.contato_envio_nf && (
                    <Field label="E-mail / Telefone" value={ordem.contato_envio_nf} />
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Histórico ── */}
          <TabsContent value="historico" className="m-0 px-4 pb-4">
            <OrdemAuditoriaTimeline ordemId={ordem.id} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
