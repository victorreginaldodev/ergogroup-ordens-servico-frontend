import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useServiceExecutionById, useUpdateServiceStatus } from '@/services/serviceList';
import { getStatusColor, getStatusLabel, formatCurrency, formatDate } from '@/data/mockData';
import { useUsers } from '@/services/users';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTask, useUpdateTask, useDeleteTask, useServiceTasks } from '@/services/tasks';
import { useOrdemServicoDetail } from '@/services/orders';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Pencil, Trash2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BackButton from '@/components/BackButton';
import { useUserRole } from '@/hooks/useUserRole';

const ServiceManagementPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { data: service, isLoading: isLoadingService } = useServiceExecutionById(String(itemId || ''));
  const { data: order, isLoading: isLoadingOrder } = useOrdemServicoDetail(
    service?.ordem_servico ? String(service.ordem_servico) : undefined,
  );
  const { data: tasks = [] } = useServiceTasks(itemId);
  const { data: users = [] } = useUsers();
  const qc = useQueryClient();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { toast } = useToast();
  const { canManageServices } = useUserRole();
  const updateStatus = useUpdateServiceStatus();
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [taskUserId, setTaskUserId] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingUserId, setEditingUserId] = useState<string>('');
  const [editingDescription, setEditingDescription] = useState('');
  const statusLabel =
    service?.status === 'concluida' ? 'completed' :
    service?.status === 'em_andamento' ? 'in_progress' :
    service?.status === 'em_espera' ? 'pending' :
    'pending';
  const statusClass = getStatusColor(statusLabel);
  const statusText = getStatusLabel(statusLabel);

  useEffect(() => {
    if (!canManageServices) {
      toast({
        title: 'Acesso restrito',
        description: 'Seu perfil não possui permissão para gerenciar serviços.',
        variant: 'destructive',
      });
      navigate('/dashboard/services');
    }
  }, [canManageServices, navigate, toast]);

  if (!canManageServices) {
    return null;
  }

  if (isLoadingService || isLoadingOrder) {
    return <div className="p-8">Carregando serviço...</div>;
  }

  const invalidateTasks = () => {
    qc.invalidateQueries({ queryKey: ['serviceTasks', itemId] });
    qc.invalidateQueries({ queryKey: ['serviceExecution', String(itemId)] });
  };

  return (
    <div className="space-y-6 animate-fade-in p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Gerenciamento de Serviço</h1>
          <p className="text-muted-foreground uppercase">{service?.repositorio_detail?.nome || ''}</p>
        </div>
        <BackButton to="/dashboard/services" />
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-muted-foreground">OS</p>
            <p className="font-mono">{order?.id ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Valor</p>
            <p className="font-semibold">
              {typeof order?.valor === 'number' || typeof order?.valor === 'string'
                ? formatCurrency(Number(order.valor))
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Conclusão</p>
            <p className="font-medium">
              {service?.data_conclusao ? formatDate(new Date(service.data_conclusao)) : '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Status</p>
            <Select
              value={service?.status}
              onValueChange={(val) => {
                if (service?.id) {
                  updateStatus.mutate(
                    { id: service.id, status: val },
                    {
                      onSuccess: () => {
                        toast({
                          title: 'Status atualizado',
                          description: 'O status do serviço foi alterado com sucesso.',
                        });
                      },
                      onError: () => {
                        toast({
                          title: 'Erro ao atualizar',
                          description: 'Não foi possível alterar o status do serviço.',
                          variant: 'destructive',
                        });
                      },
                    }
                  );
                }
              }}
            >
              <SelectTrigger className={`w-auto min-w-[130px] h-7 ${statusClass} border-0 uppercase text-white font-semibold focus:ring-0 focus:ring-offset-0 px-3 text-xs`}>
                <SelectValue placeholder={statusText} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="em_espera">Em Espera</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Nome</p>
            <p className="font-medium uppercase">{order?.cliente_detail?.nome || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Representante</p>
            <p className="font-medium">{order?.cliente_detail?.nome_representante || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Setor</p>
            <p className="font-medium">{order?.cliente_detail?.setor_representante || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">E-mail</p>
            <p className="font-medium">{order?.cliente_detail?.email_representante || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Contato</p>
            <p className="font-medium">{order?.cliente_detail?.contato_representante || '-'}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Descrição</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-secondary/30 p-4 rounded-md border border-border/50 leading-relaxed text-sm">
            {service?.descricao || '-'}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Tarefas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {createTask.isPending && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando tarefa...
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setNewTaskOpen(v => !v)}>
              {newTaskOpen ? 'Cancelar' : 'Nova Tarefa'}
            </Button>
          </div>
          {newTaskOpen && (
            <div className="mt-2 p-4 rounded-md border bg-secondary/40 space-y-3">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Executor</p>
                  <Select value={taskUserId} onValueChange={setTaskUserId}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione um executor" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.nome_completo || u.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <Textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Descrição da tarefa"
                    className="bg-secondary border-border min-h-24 resize-y"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="hero"
                  disabled={createTask.isPending}
                  onClick={() => {
                    if (!taskUserId || !taskDescription.trim() || !itemId || createTask.isPending) return;
                    setNewTaskOpen(false);
                    createTask.mutate(
                      {
                        responsavel: Number(taskUserId),
                        servico: Number(itemId),
                        descricao: taskDescription.trim(),
                      },
                      {
                        onSuccess: () => {
                          setTaskUserId('');
                          setTaskDescription('');
                          invalidateTasks();
                        },
                      }
                    );
                  }}
                >
                  {createTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {createTask.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
          <Separator />
          {tasks.length === 0 ? (
            <div className="text-muted-foreground">Nenhuma tarefa registrada</div>
          ) : (
            tasks.map((t, idx) => {
              const tLabel =
                t.status === 'concluida' ? 'completed' :
                t.status === 'em_andamento' ? 'in_progress' :
                'pending';
              return (
                <div key={t.id ?? idx} className="p-3 rounded-md border bg-secondary">
                  {editingId === t.id ? (
                    <div className="flex flex-wrap gap-4 items-end">
                      <div className="min-w-[220px] flex-1">
                        <p className="text-xs text-muted-foreground">Executor</p>
                        <Select value={editingUserId} onValueChange={setEditingUserId}>
                          <SelectTrigger className="bg-background border-border">
                            <SelectValue placeholder={t.responsavel_nome || 'Selecionar'} />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map(u => (
                              <SelectItem key={u.id} value={String(u.id)}>
                                {u.nome_completo || u.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-[220px] w-full">
                        <p className="text-xs text-muted-foreground">Descrição</p>
                        <Textarea
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          className="bg-background border-border min-h-24 resize-y"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="hero"
                          disabled={updateTask.isPending}
                          onClick={() => {
                            if (!Number.isFinite(t.id) || updateTask.isPending) {
                              toast({ title: 'Sem ID da tarefa', description: 'Não foi possível identificar a tarefa para edição.', variant: 'destructive' });
                              return;
                            }
                            updateTask.mutate(
                              {
                                id: t.id,
                                payload: {
                                  descricao: editingDescription.trim() || undefined,
                                  responsavel: editingUserId ? Number(editingUserId) : undefined,
                                },
                              },
                              {
                                onSuccess: () => {
                                  setEditingId(null);
                                  setEditingUserId('');
                                  setEditingDescription('');
                                  invalidateTasks();
                                },
                              }
                            );
                          }}
                        >
                          {updateTask.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                          {updateTask.isPending ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditingId(null);
                            setEditingUserId('');
                            setEditingDescription('');
                          }}
                        >
                          <X className="mr-2 h-4 w-4" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                      <div className="flex flex-wrap gap-6 items-center justify-between">
                      <div className="flex flex-wrap gap-6 items-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Executor</p>
                          <p className="font-medium">{t.responsavel_nome || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Início</p>
                          <p className="font-medium">{t.data_inicio || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Término</p>
                          <p className="font-medium">{t.data_termino || '-'}</p>
                        </div>
                        <Badge className={`${getStatusColor(tLabel)} border-0 uppercase`}>{getStatusLabel(tLabel)}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={() => {
                            setEditingId(t.id);
                            setEditingUserId('');
                            setEditingDescription(t.descricao || '');
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-destructive"
                          disabled={deleteTask.isPending}
                          onClick={() => {
                            if (!Number.isFinite(t.id) || deleteTask.isPending) {
                              toast({ title: 'Sem ID da tarefa', description: 'Não foi possível identificar a tarefa para exclusão.', variant: 'destructive' });
                              return;
                            }
                            deleteTask.mutate(t.id, {
                              onSuccess: () => {
                                invalidateTasks();
                              },
                            });
                          }}
                        >
                          {deleteTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="w-full bg-background border border-border/60 rounded-md p-3 leading-relaxed">
                        {t.descricao || '-'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceManagementPage;
