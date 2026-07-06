import { FormEvent, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMiniOsDetail, useUpdateMiniOs } from '../hooks';

const renderBadge = (condition: boolean, positive: string, negative: string) => (
  <Badge className={condition ? 'bg-status-completed text-primary-foreground' : 'bg-status-pending text-primary-foreground'}>
    {condition ? positive : negative}
  </Badge>
);

export function MiniOsBillingDialog({
  miniId,
  open,
  onOpenChange,
}: {
  miniId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [miniBillingValue, setMiniBillingValue] = useState<'sim' | 'nao' | ''>('');
  const [miniNfNumber, setMiniNfNumber] = useState('');

  const { data: miniDetail, isLoading: isMiniDetailLoading, isError: isMiniDetailError } =
    useMiniOsDetail(miniId ?? undefined);
  const updateMiniOs = useUpdateMiniOs();

  useEffect(() => {
    if (!miniDetail) { setMiniBillingValue(''); setMiniNfNumber(''); return; }
    setMiniBillingValue(miniDetail.faturada ? 'sim' : 'nao');
    setMiniNfNumber(miniDetail.numero_nf ?? '');
  }, [miniDetail]);

  const handleMiniSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!miniId) return;
    try {
      await updateMiniOs.mutateAsync({
        id: miniId,
        payload: { faturada: miniBillingValue === 'sim', numero_nf: miniNfNumber || null },
      });
    } catch (err) { console.error(err); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da tarefa rápida</DialogTitle>
        </DialogHeader>

        {isMiniDetailLoading && (
          <div className="py-6 text-center text-muted-foreground">Carregando detalhes da tarefa rápida...</div>
        )}

        {isMiniDetailError && !isMiniDetailLoading && (
          <div className="py-6 text-center text-destructive">Não foi possível carregar os detalhes da tarefa rápida.</div>
        )}

        {!isMiniDetailLoading && !isMiniDetailError && miniDetail && (
          <div className="space-y-6 pb-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">Cliente</h3>
              <p className="text-lg font-bold">{miniDetail.cliente_detail?.nome ?? 'Cliente não informado'}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-secondary/50 p-4">
                <span className="text-xs text-muted-foreground">Quantidade</span>
                <p className="text-base font-medium">{miniDetail.quantidade ?? '-'}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-4">
                <span className="text-xs text-muted-foreground">Status</span>
                <div className="mt-1">
                  {renderBadge((miniDetail.status ?? '').toLowerCase() === 'finalizada', 'Finalizada', miniDetail.status ?? 'Em andamento')}
                </div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-4">
                <span className="text-xs text-muted-foreground">NF atual</span>
                <p className="text-base font-medium">{miniDetail.numero_nf ?? '-'}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-secondary/50 p-4">
                <span className="text-xs text-muted-foreground">Data de início</span>
                <p className="text-base font-medium">{miniDetail.data_inicio ?? '-'}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-4">
                <span className="text-xs text-muted-foreground">Data de término</span>
                <p className="text-base font-medium">{miniDetail.data_termino ?? '-'}</p>
              </div>
            </div>

            <div className="rounded-lg bg-secondary/50 p-4">
              <span className="text-xs text-muted-foreground">Serviço</span>
              <p className="text-base font-medium">{miniDetail.servico_detail?.nome ?? '-'}</p>
            </div>

            <div className="rounded-lg bg-secondary/50 p-4">
              <span className="text-xs text-muted-foreground">Descrição</span>
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {miniDetail.descricao?.trim() || 'Sem descrição.'}
              </p>
            </div>

            <div className="rounded-lg bg-secondary/50 p-4">
              <span className="text-xs text-muted-foreground">Responsável</span>
              <p className="text-base font-medium">{miniDetail.responsavel_nome ?? 'Não informado'}</p>
            </div>

            <form onSubmit={handleMiniSubmit} className="space-y-4">
              <h4 className="text-sm font-semibold uppercase text-muted-foreground">Atualizar faturamento</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mini-faturamento">Faturamento</Label>
                  <Select value={miniBillingValue} onValueChange={(v) => setMiniBillingValue(v as 'sim' | 'nao')} disabled={updateMiniOs.isPending}>
                    <SelectTrigger id="mini-faturamento"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mini-nf">Número da NF</Label>
                  <Input id="mini-nf" value={miniNfNumber} onChange={(e) => setMiniNfNumber(e.target.value)} placeholder="Ex.: 12345" disabled={updateMiniOs.isPending} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMiniOs.isPending}>
                  {updateMiniOs.isPending ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
