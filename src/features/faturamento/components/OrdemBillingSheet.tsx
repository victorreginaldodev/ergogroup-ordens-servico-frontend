import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { MoneyValue } from '@/components/common/MoneyValue';
import { formatCurrency } from '@/data/mockData';
import { OrdemAuditoriaTimeline } from '@/features/ordens/components/OrdemAuditoriaTimeline';
import { useServiceOrder, useUpdateServiceOrderBilling } from '@/services/orders';
import { safeFormatDate } from '../utils';

function SField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value ?? '—'}</p>
    </div>
  );
}

export function OrdemBillingSheet({
  orderId,
  open,
  onOpenChange,
  tab,
  onTabChange,
}: {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: 'cobranca' | 'historico';
  onTabChange: (tab: 'cobranca' | 'historico') => void;
}) {
  const [faturamentoValue, setFaturamentoValue] = useState<'sim' | 'nao' | ''>('');
  const [billingDate, setBillingDate] = useState('');
  const [nfNumber, setNfNumber] = useState('');

  const { data: orderDetail, isLoading: isDetailLoading, isError: isDetailError } =
    useServiceOrder(orderId ? String(orderId) : undefined);
  const updateServiceOrderBilling = useUpdateServiceOrderBilling();

  useEffect(() => {
    if (!orderDetail) { setFaturamentoValue(''); setBillingDate(''); setNfNumber(''); return; }
    setFaturamentoValue(orderDetail.faturada ? 'sim' : 'nao');
    setBillingDate(orderDetail.data_faturamento ?? '');
    setNfNumber(orderDetail.numero_nf != null ? String(orderDetail.numero_nf) : '');
  }, [orderDetail]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!orderId) return;
    try {
      await updateServiceOrderBilling.mutateAsync({
        id: orderId,
        payload: { data_faturamento: billingDate || null, numero_nf: nfNumber ? Number(nfNumber) : null },
      });
    } catch (err) { console.error(err); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[680px]">

        {/* Header */}
        <SheetHeader className="flex-row items-start justify-between gap-4 border-b border-border px-6 py-4 pr-14 space-y-0">
          <div className="min-w-0">
            <SheetTitle className="truncate text-base">
              {orderDetail?.cliente_detail?.nome ?? `OS #${orderId}`}
            </SheetTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">OS #{orderId}</p>
          </div>
          <Link
            to={`/dashboard/orders/${orderId}`}
            onClick={() => onOpenChange(false)}
            className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Ver OS
          </Link>
        </SheetHeader>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => onTabChange(v as 'cobranca' | 'historico')} className="flex min-h-0 flex-1 flex-col">
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
            {orderId && <OrdemAuditoriaTimeline ordemId={orderId} />}
          </TabsContent>
        </Tabs>

      </SheetContent>
    </Sheet>
  );
}
