import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useMinioRepositories, useRepoMinioServices, useMinioById, useDeleteQuickTask, useUpdateQuickTask } from '@/services/quickTasks';
import { getStatusColor, getStatusLabel } from '@/data/mockData';
import { Pencil, Trash } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useClients } from '@/services/clients';
import { useUsers } from '@/services/users';
import { useCreateQuickTask } from '@/services/quickTasks';
import { useQueryClient } from '@tanstack/react-query';
import { useUserRole } from '@/hooks/useUserRole';
import { Switch } from '@/components/ui/switch';

const QuickTasksPage = () => {
  const { data: items = [], isLoading, error } = useMinioRepositories();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: clients = [] } = useClients();
  const { data: profiles = [] } = useUsers();
  const { data: servicesMinio = [] } = useRepoMinioServices();
  const createQuickTask = useCreateQuickTask();
  const qc = useQueryClient();
  const { data: minioDetail, isLoading: loadingDetail } = useMinioById(selectedId ?? undefined);
  const deleteQuickTask = useDeleteQuickTask();
  const updateQuickTask = useUpdateQuickTask();
  const [form, setForm] = useState({
    quantidade: 1,
    descricao: '',
    data_recebimento: '',
    data_inicio: '',
    data_termino: '',
    status: 'nao_iniciado',
    revisao_cliente: false,
    cliente: 0,
    servico: 0,
    profile: 0,
  });
  const isValid = form.cliente > 0 && form.servico > 0 && (form.quantidade ?? 0) > 0 && !!form.data_recebimento;
  const { canManageQuickTasks } = useUserRole();

  useEffect(() => {
    if (isEdit && minioDetail) {
      const d: any = minioDetail;
      const st = String(d?.status || '').toLowerCase();
      const norm = st === 'finalizada' || st === 'concluida' ? 'finalizada' : st === 'em_andamento' ? 'em_andamento' : 'nao_iniciado';
      setForm({
        quantidade: Number(d?.quantidade ?? 1),
        descricao: String(d?.descricao ?? ''),
        data_recebimento: String(d?.data_recebimento ?? ''),
        data_inicio: String(d?.data_inicio ?? ''),
        data_termino: String(d?.data_termino ?? ''),
        status: norm,
        revisao_cliente: Boolean(d?.revisao_cliente ?? false),
        cliente: Number(d?.cliente?.id ?? 0),
        servico: Number(d?.servico?.id ?? 0),
        profile: Number(d?.profile?.id ?? 0),
      });
    }
  }, [isEdit, minioDetail]);

  const mapStatus = (s: string) => {
    const n = String(s || '').toLowerCase();
    if (n === 'finalizada' || n === 'concluida' || n === 'concluído' || n === 'concluido' || n === 'completed') return 'completed';
    if (n === 'em_andamento' || n === 'in_progress') return 'in_progress';
    if (n === 'nao_iniciada' || n === 'não iniciada' || n === 'pendente' || n === 'pending' || n === '') return 'pending';
    return 'pending';
  };

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return items.filter((t: any) => {
      const client = String(t?.cliente?.nome || t?.cliente_nome || '').toLowerCase();
      const service = String(t?.servico?.nome || t?.repositorio_nome || t?.nome_servico || '').toLowerCase();
      const matchesSearch = !term || client.includes(term) || service.includes(term);
      const s = mapStatus(t?.status);
      const matchesStatus = statusFilter === 'all' || s === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const ordered = useMemo(() => {
    const order: Record<'pending' | 'in_progress' | 'completed', number> = { pending: 0, in_progress: 1, completed: 2 };
    return [...filtered].sort((a: any, b: any) => order[mapStatus(a?.status)] - order[mapStatus(b?.status)]);
  }, [filtered]);

  const itemsPerPage = 100;
  const totalPages = Math.ceil(ordered.length / itemsPerPage) || 1;
  const paginated = ordered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => {
    setPage(1);
  }, [items, searchTerm, statusFilter]);

  if (error) {
    return <div className="text-destructive">Falha ao carregar tarefas rápidas.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tarefas Rápidas</h1>
          <p className="text-muted-foreground">Visualização simplificada de tarefas rápidas</p>
        </div>
        <Button
          disabled={!canManageQuickTasks}
          onClick={() => {
            if (!canManageQuickTasks) return;
            setIsEdit(false);
            setSelectedId(null);
            setForm({
              quantidade: 1,
              descricao: '',
              data_recebimento: '',
              data_inicio: '',
              data_termino: '',
              status: 'nao_iniciado',
              revisao_cliente: false,
              cliente: 0,
              servico: 0,
              profile: 0,
            });
            setCreateOpen(true);
          }}
        >
          Nova tarefa rápida
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por cliente ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="w-[200px]">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">NÃO INICIADO</SelectItem>
                  <SelectItem value="in_progress">EM ANDAMENTO</SelectItem>
                  <SelectItem value="completed">FINALIZADA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="uppercase w-16">ID</TableHead>
                <TableHead className="uppercase">Cliente</TableHead>
                <TableHead className="uppercase">Serviço</TableHead>
                <TableHead className="uppercase w-40">Status</TableHead>
                <TableHead className="uppercase w-16">Editar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, idx) => (
                    <TableRow key={`skeleton-${idx}`} className="border-border">
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                  ))
                : paginated.map((t: any) => {
                    const label = mapStatus(t?.status);
                    const statusText = {
                      pending: 'NÃO INICIADO',
                      in_progress: 'EM ANDAMENTO',
                      completed: 'FINALIZADA',
                    }[label] || 'PENDENTE';
                    return (
                      <TableRow key={t.id} className="border-border">
                        <TableCell className="font-mono">{t.id}</TableCell>
                        <TableCell className="uppercase">{t.cliente?.nome || t.cliente_nome || '-'}</TableCell>
                        <TableCell className="uppercase">{t.servico?.nome || t.repositorio_nome || t.nome_servico || '-'}</TableCell>
                        <TableCell className="w-40">
                          <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap inline-flex uppercase ${getStatusColor(label)}`}>
                            {statusText}
                          </span>
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label="Editar"
                            disabled={!canManageQuickTasks}
                            onClick={() => {
                              if (!canManageQuickTasks) return;
                              setIsEdit(true);
                              setSelectedId(Number(t.id));
                              setCreateOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            aria-label="Excluir"
                            disabled={deleteQuickTask.isPending || !canManageQuickTasks}
                            onClick={() => {
                              if (!canManageQuickTasks) return;
                              const id = Number(t.id);
                              if (!id) return;
                              if (window.confirm('Excluir esta tarefa rápida?')) {
                                deleteQuickTask.mutate(id, {
                                  onSuccess: async () => {
                                    await qc.invalidateQueries({ queryKey: ['quickTasksMinioRepos'] });
                                  },
                                });
                              }
                            }}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              {!isLoading && ordered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma tarefa rápida encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="px-4">
            <Separator />
          </div>
          {totalPages > 1 && (
            <div className="p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {(() => {
                    const siblingCount = 1;
                    const pgs: (number | 'ellipsis')[] = [];
                    if (totalPages <= 7) {
                      for (let p = 1; p <= totalPages; p++) pgs.push(p);
                    } else {
                      pgs.push(1);
                      const left = Math.max(page - siblingCount, 2);
                      const right = Math.min(page + siblingCount, totalPages - 1);
                      if (left > 2) pgs.push('ellipsis');
                      for (let p = left; p <= right; p++) pgs.push(p);
                      if (right < totalPages - 1) pgs.push('ellipsis');
                      pgs.push(totalPages);
                    }
                    return pgs.map((it, idx) => (
                      <PaginationItem key={`${it}-${idx}`}>
                        {it === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            isActive={it === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(it as number);
                            }}
                          >
                            {it as number}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ));
                  })()}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages) setPage(page + 1);
                      }}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={canManageQuickTasks && createOpen}
        onOpenChange={(open) => {
          if (!canManageQuickTasks && open) return;
          setCreateOpen(open);
          if (!open) {
            setIsEdit(false);
            setSelectedId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar Tarefa Rápida' : 'Criar Tarefa Rápida'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {isEdit && loadingDetail ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
            <>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                <Select
                  value={String(form.cliente)}
                  onValueChange={(v) => setForm({ ...form, cliente: Number(v) })}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Serviço</p>
                  <Select
                    value={String(form.servico)}
                    onValueChange={(v) => setForm({ ...form, servico: Number(v) })}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicesMinio.map((s: any) => (
                        <SelectItem key={String(s.id ?? s.pk ?? s.codigo ?? s.nome)} value={String(s.id ?? s.pk ?? s.codigo ?? 0)}>
                          {String(s.nome ?? s.nome_repositorio ?? s.descricao ?? 'SERVIÇO')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Técnico</p>
                  <Select
                    value={String(form.profile)}
                    onValueChange={(v) => setForm({ ...form, profile: Number(v) })}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Selecione o técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles
                        .filter(p => p.tipo_usuario === 'tecnico')
                        .map(p => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.user.username}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Quantidade</p>
                <Input
                  type="number"
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) || 0 })}
                  className="bg-background border-border"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Recebimento</p>
                <Input
                  type="date"
                  value={form.data_recebimento}
                  onChange={(e) => setForm({ ...form, data_recebimento: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao_iniciado">NÃO INICIADO</SelectItem>
                    <SelectItem value="em_andamento">EM ANDAMENTO</SelectItem>
                    <SelectItem value="finalizada">FINALIZADA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Revisão do cliente</p>
                <div className="flex items-center gap-2 py-2">
                  <Switch
                    checked={form.revisao_cliente}
                    onCheckedChange={(v) => setForm({ ...form, revisao_cliente: Boolean(v) })}
                  />
                  <span className="text-xs text-muted-foreground">
                    {form.revisao_cliente ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Início</p>
                <Input
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Término</p>
                <Input
                  type="date"
                  value={form.data_termino}
                  onChange={(e) => setForm({ ...form, data_termino: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Descrição</p>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="bg-background border-border min-h-24 resize-y"
              />
            </div>
            <div className="flex justify-end gap-2">
              {isEdit && selectedId ? (
                <Button
                  variant="hero"
                  disabled={!canManageQuickTasks || updateQuickTask.isPending}
                  onClick={() => {
                    if (!canManageQuickTasks || updateQuickTask.isPending) return;
                    const id = selectedId!;
                    const payload = {
                      quantidade: form.quantidade,
                      descricao: form.descricao,
                      data_recebimento: form.data_recebimento,
                      data_inicio: form.data_inicio || null,
                      data_termino: form.data_termino || null,
                      status: form.status,
                      revisao_cliente: form.revisao_cliente,
                      cliente: form.cliente,
                      servico: form.servico,
                      profile: form.profile,
                    };
                    updateQuickTask.mutate({ id, payload }, {
                      onSuccess: async () => {
                        await qc.invalidateQueries({ queryKey: ['quickTasksMinioRepos'] });
                        setCreateOpen(false);
                        setSelectedId(null);
                      },
                    });
                  }}
                >
                  {updateQuickTask.isPending ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              ) : (
                <Button
                  variant="hero"
                  disabled={!canManageQuickTasks || !isValid || createQuickTask.isPending}
                  onClick={() => {
                    if (!canManageQuickTasks || !isValid || createQuickTask.isPending) return;
                    const payload = {
                      quantidade: form.quantidade,
                      descricao: form.descricao,
                      data_recebimento: form.data_recebimento,
                      data_inicio: form.data_inicio || null,
                      data_termino: form.data_termino || null,
                      status: form.status || 'nao_iniciado',
                      revisao_cliente: form.revisao_cliente,
                      cliente: form.cliente,
                      servico: form.servico,
                      profile: form.profile,
                    };
                    createQuickTask.mutate(payload, {
                      onSuccess: async () => {
                        await qc.invalidateQueries({ queryKey: ['quickTasksMinioRepos'] });
                        setCreateOpen(false);
                        setForm({
                          quantidade: 1,
                          descricao: '',
                          data_recebimento: '',
                          data_inicio: '',
                          data_termino: '',
                          status: 'nao_iniciado',
                          revisao_cliente: false,
                          cliente: 0,
                          servico: 0,
                          profile: 0,
                        });
                      },
                    });
                  }}
                >
                  {createQuickTask.isPending ? 'Criando...' : 'Criar'}
                </Button>
              )}
            </div>
            </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuickTasksPage;
