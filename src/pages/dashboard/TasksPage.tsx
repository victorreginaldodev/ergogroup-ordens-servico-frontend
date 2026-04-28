import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { MoreVertical, Edit } from 'lucide-react';
import { useTaskById, useTasksList, useUpdateTask } from '@/services/tasks';
import { getStatusColor, getStatusLabel } from '@/data/mockData';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useUserRole } from '@/hooks/useUserRole';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';

const TasksPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: tasks = [], isLoading, error } = useTasksList();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { role, canManageTasks } = useUserRole();
  const isTecnico = role === 'tecnico';
  const showUserColumn = !isTecnico;
  const showActions = canManageTasks;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: detail, isLoading: loadingDetail } = useTaskById(selectedId ?? undefined);
  const updateTask = useUpdateTask();
  const qc = useQueryClient();
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editStatus, setEditStatus] = useState('nao_iniciada');

  useEffect(() => {
    if (detail) {
      setEditStart(detail?.data_inicio || '');
      setEditEnd(detail?.data_termino || '');
      const s = String(detail?.status || '').toLowerCase();
      const norm = s === 'concluida' ? 'concluida' : s === 'em_andamento' ? 'em_andamento' : 'nao_iniciada';
      setEditStatus(norm);
    }
  }, [detail]);

  const items = useMemo(() => {
    const filtered = tasks.filter(t => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = (
        String(t.cliente_nome || '').toLowerCase().includes(term) ||
        String(t.repositorio_nome || '').toLowerCase().includes(term) ||
        String(t.responsavel_nome || '').toLowerCase().includes(term)
      );
      const s = String(t.status || '').toLowerCase();
      const normalized = s === 'concluida' ? 'completed' : s === 'em_andamento' ? 'in_progress' : 'pending';
      const matchesStatus = statusFilter === 'all' || normalized === statusFilter;
      return matchesSearch && matchesStatus;
    });
    const order: Record<'pending' | 'in_progress' | 'completed', number> = { pending: 0, in_progress: 1, completed: 2 };
    return filtered.sort((a, b) => {
      const sa = String(a.status || '').toLowerCase();
      const sb = String(b.status || '').toLowerCase();
      const na = sa === 'concluida' ? 'completed' : sa === 'em_andamento' ? 'in_progress' : 'pending';
      const nb = sb === 'concluida' ? 'completed' : sb === 'em_andamento' ? 'in_progress' : 'pending';
      const statusDiff = order[na] - order[nb];
      if (statusDiff !== 0) return statusDiff;
      const dateA = a.atualizado_em ? new Date(a.atualizado_em).getTime() : 0;
      const dateB = b.atualizado_em ? new Date(b.atualizado_em).getTime() : 0;
      if (dateA !== dateB) return dateB - dateA;
      return b.id - a.id;
    });
  }, [tasks, searchTerm, statusFilter]);

  const itemsPerPage = 100;
  const totalPages = Math.ceil(items.length / itemsPerPage) || 1;
  const paginated = items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  if (error) {
    return <div className="text-destructive">Falha ao carregar tarefas.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <p className="text-muted-foreground">Lista de tarefas executadas</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-1">
              <Input placeholder="Buscar por cliente, serviço ou usuário..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">N?o iniciada</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Conclu?da</SelectItem>
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
                <TableHead className="uppercase">Repositório</TableHead>
                {showUserColumn && <TableHead className="uppercase">Usuário</TableHead>}
                <TableHead className="w-48 uppercase">Status</TableHead>
                {showActions && <TableHead className="w-16 uppercase">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 10 }).map((_, idx) => (
                    <TableRow key={`skeleton-${idx}`} className="border-border">
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                      {showUserColumn && <TableCell><Skeleton className="h-4 w-28" /></TableCell>}
                      <TableCell className="w-48"><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                      {showActions && <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>}
                    </TableRow>
                  ))
                : paginated.map((t) => {
                    const s = (t.status || '').toLowerCase();
                    const label = s === 'concluida' ? 'completed' : s === 'em_andamento' ? 'in_progress' : 'pending';
                    return (
                      <TableRow key={t.id} className={`border-border ${showActions ? 'cursor-pointer hover:bg-muted/40' : ''}`} onClick={() => { if (!showActions) return; setSelectedId(t.id); setDetailsOpen(true); }}>
                        <TableCell className="font-mono">{t.id}</TableCell>
                        <TableCell className="uppercase">{t.cliente_nome || '-'}</TableCell>
                        <TableCell className="uppercase">{t.repositorio_nome || '-'}</TableCell>
                        {showUserColumn && <TableCell className="uppercase">{t.responsavel_nome}</TableCell>}
                        <TableCell className="w-48"><span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap inline-flex uppercase ${getStatusColor(label)}`}>{getStatusLabel(label)}</span></TableCell>
                        {showActions && (
                          <TableCell>
                            <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Acoes da tarefa"><MoreVertical className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setSelectedId(t.id); setDetailsOpen(true); }}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
              {!isLoading && items.length === 0 && <TableRow><TableCell colSpan={4 + (showUserColumn ? 1 : 0) + (showActions ? 1 : 0)} className="text-center text-muted-foreground py-8">Nenhuma tarefa encontrada</TableCell></TableRow>}
            </TableBody>
          </Table>
          <div className="px-4"><Separator /></div>
          {totalPages > 1 && <div className="p-4"><Pagination><PaginationContent><PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }} className={page === 1 ? 'pointer-events-none opacity-50' : ''} /></PaginationItem>{(() => { const siblingCount = 1; const items: (number | 'ellipsis')[] = []; if (totalPages <= 7) { for (let p = 1; p <= totalPages; p++) items.push(p); } else { items.push(1); const left = Math.max(page - siblingCount, 2); const right = Math.min(page + siblingCount, totalPages - 1); if (left > 2) items.push('ellipsis'); for (let p = left; p <= right; p++) items.push(p); if (right < totalPages - 1) items.push('ellipsis'); items.push(totalPages); } return items.map((it, idx) => <PaginationItem key={`${it}-${idx}`}>{it === 'ellipsis' ? <PaginationEllipsis /> : <PaginationLink href="#" isActive={it === page} onClick={(e) => { e.preventDefault(); setPage(it as number); }}>{it as number}</PaginationLink>}</PaginationItem>); })()}<PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} /></PaginationItem></PaginationContent></Pagination></div>}
        </CardContent>
      </Card>

      <Dialog open={showActions && detailsOpen} onOpenChange={(v) => { if (!showActions && v) return; setDetailsOpen(v); if (!v) setSelectedId(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Tarefa</DialogTitle>
            <DialogDescription>Informa??es da execu??o e do cliente</DialogDescription>
          </DialogHeader>
          {loadingDetail ? (
            <div className="space-y-4"><Skeleton className="h-6 w-64" /><Skeleton className="h-24 w-full" /><Skeleton className="h-6 w-48" /><Skeleton className="h-32 w-full" /></div>
          ) : (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-4 gap-4">
                <div><p className="text-xs text-muted-foreground">ID</p><p className="font-mono">{detail?.id ?? '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-semibold uppercase">{detail?.cliente_nome || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Repositório</p><p className="font-semibold uppercase">{detail?.repositorio_nome || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p>{(() => { const s = String(detail?.status || '').toLowerCase(); const label = s === 'concluida' ? 'completed' : s === 'em_andamento' ? 'in_progress' : 'pending'; return <Badge className={`${getStatusColor(label)} border-0 uppercase`}>{getStatusLabel(label)}</Badge>; })()}</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Responsável</p><p className="font-medium uppercase">{detail?.responsavel_nome || '-'}</p></div>
              </div>
              <div className="space-y-2"><p className="text-xs text-muted-foreground">Descrição da Tarefa</p><div className="bg-secondary/30 p-4 rounded-md border border-border/50 leading-relaxed text-sm">{detail?.descricao || '-'}</div></div>
              <div className="grid sm:grid-cols-3 gap-4"><div><p className="text-xs text-muted-foreground">Início</p><p className="font-medium">{detail?.data_inicio || '-'}</p></div><div><p className="text-xs text-muted-foreground">Término</p><p className="font-medium">{detail?.data_termino || '-'}</p></div></div>
              <Separator />
              <div className="space-y-3"><p className="text-xs text-muted-foreground">Atualizar tarefa</p><div className="grid sm:grid-cols-3 gap-4"><div><p className="text-xs text-muted-foreground mb-1">In?cio</p><Input type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="bg-background border-border" /></div><div><p className="text-xs text-muted-foreground mb-1">T?rmino</p><Input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="bg-background border-border" /></div><div><p className="text-xs text-muted-foreground mb-1">Status</p><Select value={editStatus} onValueChange={setEditStatus}><SelectTrigger className="bg-background border-border"><SelectValue placeholder="Selecione o status" /></SelectTrigger><SelectContent><SelectItem value="nao_iniciada">N?o iniciada</SelectItem><SelectItem value="em_andamento">Em andamento</SelectItem><SelectItem value="concluida">Conclu?da</SelectItem></SelectContent></Select></div></div><div className="flex justify-end"><Button variant="hero" disabled={updateTask.isPending || !selectedId} onClick={() => { if (!selectedId || updateTask.isPending) return; updateTask.mutate({ id: selectedId, payload: { data_inicio: editStart || undefined, data_termino: editEnd || undefined, status: editStatus || undefined } }, { onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['taskDetail', selectedId] }); await qc.invalidateQueries({ queryKey: ['tasksList'] }); setDetailsOpen(false); setSelectedId(null); } }); }}>{updateTask.isPending ? 'Salvando...' : 'Salvar altera??es'}</Button></div></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;
