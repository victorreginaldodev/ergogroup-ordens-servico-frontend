import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ChevronRight, Loader2, Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUserRole } from '@/hooks/useUserRole';
import { useUsers } from '@/services/users';
import {
  useServicoDetalhe,
  useTarefasDeServico,
  useCreateTarefa,
  useUpdateTarefa,
  useDeleteTarefa,
} from '../hooks';
import { ServicoHeroCard } from '../components/ServicoHeroCard';
import { TarefaRow } from '../components/TarefaRow';
import type { UpdateTarefaPayload } from '../services';

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-48 rounded" />
      <Skeleton className="h-[160px] w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="space-y-px">
        <Skeleton className="h-40 rounded-none rounded-t-2xl" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40 rounded-none rounded-b-2xl" />
      </div>
    </div>
  );
}

const ServicoDetalhePage = () => {
  const { id, servicoId } = useParams<{ id: string; servicoId: string }>();
  const ordemId = id        ? Number(id)        : undefined;
  const svcId   = servicoId ? Number(servicoId) : undefined;

  const [dialogOpen, setDialogOpen]           = useState(false);
  const [novaDescricao, setNovaDescricao]     = useState('');
  const [novaResponsavel, setNovaResponsavel] = useState('');

  const { canManageTasks } = useUserRole();

  const { data: servico, isLoading: loadingServico, isError } = useServicoDetalhe(svcId);
  const { data: tarefas, isLoading: loadingTarefas }          = useTarefasDeServico(svcId);
  const { data: usuarios = [] }                               = useUsers();

  const ctx = { servicoId: svcId ?? 0, ordemId: ordemId ?? 0 };
  const createMutation = useCreateTarefa(ctx);
  const updateMutation = useUpdateTarefa(ctx);
  const deleteMutation = useDeleteTarefa(ctx);
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleOpenDialog = () => {
    setNovaDescricao('');
    setNovaResponsavel('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setNovaDescricao('');
    setNovaResponsavel('');
    setDialogOpen(false);
  };

  const handleCriarTarefa = () => {
    if (!novaDescricao.trim() || !novaResponsavel || !svcId) return;
    createMutation.mutate(
      { servico: svcId, descricao: novaDescricao.trim(), responsavel: Number(novaResponsavel) },
      { onSuccess: handleCloseDialog },
    );
  };

  if (loadingServico) return <PageSkeleton />;

  if (isError || !servico) {
    return (
      <div className="space-y-4">
        <Link
          to={`/dashboard/orders/${ordemId}`}
          className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" />
          Voltar para OS
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar serviço</AlertTitle>
          <AlertDescription>Não foi possível recuperar os dados deste serviço.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const nome = servico.repositorio_detail?.nome ?? servico.repositorio_nome ?? `Serviço #${servico.id}`;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/dashboard/orders" className="transition-colors hover:text-foreground">
          Ordens de Serviço
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <Link to={`/dashboard/orders/${ordemId}`} className="transition-colors hover:text-foreground">
          OS #{ordemId}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="font-medium text-foreground">{nome}</span>
      </nav>

      {/* Hero */}
      <ServicoHeroCard
        servico={servico}
        ordemId={ordemId!}
        tarefasCount={loadingTarefas ? undefined : (tarefas?.length ?? 0)}
      />

      {/* Descrição */}
      {servico.descricao && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Descrição
          </p>
          <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm leading-relaxed text-foreground">
            {servico.descricao}
          </p>
        </div>
      )}

      {/* Tarefas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Tarefas</h2>
            {tarefas?.length ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                {tarefas.length}
              </span>
            ) : null}
          </div>
          {canManageTasks && (
            <Button type="button" variant="hero" size="sm" onClick={handleOpenDialog}>
              <Plus className="mr-1.5 h-4 w-4" /> Nova tarefa
            </Button>
          )}
        </div>

        {loadingTarefas ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3 rounded-xl border border-border p-4">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-8 rounded" />
                  <Skeleton className="h-8 rounded" />
                  <Skeleton className="h-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : tarefas?.length ? (
          <div className="space-y-3">
            {tarefas.map((t) => (
              <div key={t.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <TarefaRow
                  tarefa={t}
                  usuarios={usuarios}
                  onStatusChange={(id, status) => updateMutation.mutate({ id, payload: { status } })}
                  onEdit={(id, payload: UpdateTarefaPayload) => updateMutation.mutate({ id, payload })}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  isPending={isMutating}
                  canManage={canManageTasks}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma tarefa vinculada a este serviço.</p>
        )}
      </div>

      {/* Modal — Nova tarefa */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Nova tarefa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Responsável</p>
              <Select value={novaResponsavel} onValueChange={setNovaResponsavel}>
                <SelectTrigger className="h-9 border-border bg-background text-sm">
                  <SelectValue placeholder="Selecionar responsável" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.nome_completo || u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Descrição</p>
              <Textarea
                value={novaDescricao}
                onChange={(e) => setNovaDescricao(e.target.value)}
                placeholder="Descreva a tarefa..."
                className="min-h-24 resize-none border-border bg-background text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={createMutation.isPending}>
              Cancelar
            </Button>
            <Button
              variant="hero"
              onClick={handleCriarTarefa}
              disabled={!novaDescricao.trim() || !novaResponsavel || createMutation.isPending}
            >
              {createMutation.isPending
                ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                : <Plus    className="mr-1.5 h-4 w-4" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicoDetalhePage;
