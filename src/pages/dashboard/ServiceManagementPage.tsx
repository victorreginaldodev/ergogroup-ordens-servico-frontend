import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/data/mockData';
import { useUsers } from '@/services/users';
import { useCurrentUser } from '@/services/admin';
import { useServiceExecutionById } from '@/services/serviceList';
import { useExecutores, useExecutorOperations, StatusExecucao } from '@/services/executores';
import { useChecklists, useChecklistOperations } from '@/services/checklist';
import { useComentarios, useComentarioOperations } from '@/services/comentarios';
import { useServiceItemManagement } from '@/services/serviceManagement';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  CheckCircle2,
  Wrench,
  CircleDashed,
  PlayCircle,
  UserPlus,
  MessageSquare,
  ClipboardList,
  Plus,
  MoreVertical,
  ArrowLeft,
  Trash2,
  User,
  FileText,
  Calendar,
  Clock,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { ServiceItemManagement, User as UserType, ServiceStatus } from '@/types';

const ServiceManagementPage = () => {
  const params = useParams();
  const orderId = params.orderId || '';
  const itemId = params.itemId || '';

  const { data: serviceExecution, isLoading } = useServiceExecutionById(itemId);

  const item = useMemo(() => {
    if (!serviceExecution) return undefined;
    
    let status: ServiceStatus = 'pending';
    if (serviceExecution.status === 'nao_iniciado') status = 'pending';
    else if (serviceExecution.status === 'em_andamento') status = 'in_progress';
    else if (serviceExecution.status === 'concluido') status = 'completed';

    return {
      id: serviceExecution.id.toString(),
      serviceId: (serviceExecution.id ?? itemId).toString(),
      serviceName: serviceExecution.nome_servico,
      quantity: serviceExecution.quantidade,
      unitPrice: parseFloat(serviceExecution.valor),
      total: serviceExecution.quantidade * parseFloat(serviceExecution.valor),
      status: status,
    };
  }, [serviceExecution]);

  const order = useMemo(() => {
    if (!serviceExecution) return undefined;
    const detailsStatus = serviceExecution.status;
    const clientName = serviceExecution.nome_cliente;
    const orderIdentifier = orderId || String(serviceExecution.id);
    let status: ServiceStatus = 'pending';
    if (detailsStatus === 'nao_iniciado') status = 'pending';
    else if (detailsStatus === 'em_andamento') status = 'in_progress';
    else if (detailsStatus === 'concluido') status = 'completed';

    return {
      id: orderIdentifier.toString(),
      orderNumber: orderIdentifier.toString(),
      clientName: clientName,
      status: status,
      services: [item],
    };
  }, [serviceExecution, item]);

  const svcDescription = serviceExecution?.descricao || '';
  


  const { data: users = [] } = useUsers();
  const { data: currentUser } = useCurrentUser();
  const { canManageFinancials } = useUserRole();
  const { data: mgmt } = useServiceItemManagement(orderId, itemId);
  const { data: executors = [] } = useExecutores(Number(itemId));
  const { data: checklists = [] } = useChecklists(Number(itemId));
  const { createExecutor, updateExecutor, removeExecutor } = useExecutorOperations(Number(itemId));
  const { 
    createChecklist, 
    updateChecklist, 
    deleteChecklist, 
    createItem, 
    updateItem, 
    deleteItem 
  } = useChecklistOperations(Number(itemId));

  const { data: comentarios = [] } = useComentarios(Number(itemId));
  const { createComentario, deleteComentario } = useComentarioOperations(Number(itemId));

  const [collabToAdd, setCollabToAdd] = useState<string>('');
  const [newComment, setNewComment] = useState('');
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});
  const [titles, setTitles] = useState<Record<string, string>>({});

  const canMarkOwn = executors.some(c => c.executor === currentUser?.id);
  const myCollab = executors.find(c => c.executor === currentUser?.id);

  const earliestStart = useMemo(() => {
    const starts = (executors || [])
      .map(c => c.data_inicio)
      .filter(Boolean) as string[];
    if (starts.length === 0) return undefined;
    return new Date(Math.min(...starts.map(s => new Date(s).getTime())));
  }, [executors]);

  const latestEnd = useMemo(() => {
    const ends = (executors || [])
      .map(c => c.data_termino)
      .filter(Boolean) as string[];
    if (ends.length === 0) return undefined;
    return new Date(Math.max(...ends.map(s => new Date(s).getTime())));
  }, [executors]);

  const durationLabel = useMemo(() => {
    if (!earliestStart || !latestEnd) return '-';
    const ms = latestEnd.getTime() - earliestStart.getTime();
    if (ms <= 0) return '-';
    const minutes = Math.floor(ms / 60000);
    const days = Math.floor(minutes / (60 * 24));
    const hours = Math.floor((minutes % (60 * 24)) / 60);
    const mins = minutes % 60;
    const parts: string[] = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    parts.push(`${mins}m`);
    return parts.join(' ');
  }, [earliestStart, latestEnd]);

  const usersById: Record<string, UserType> = useMemo(() => Object.fromEntries(users.map(u => [u.id, u])), [users]);

  if (isLoading) {
    return <div className="p-8 flex justify-center">Carregando detalhes do serviço...</div>;
  }

  if (!order || !item) {
    return (
      <div className="space-y-6 animate-fade-in">
        <BackButton to="/dashboard/orders" label="Voltar para Ordens" />
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Item não encontrado</CardTitle>
            <CardDescription>Verifique o link ou selecione a ordem correta.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const orderStatusColor = getStatusColor(order.status);
  const orderStatusLabel = getStatusLabel(order.status);
  const serviceStatusColor = getStatusColor(item.status);
  const serviceStatusLabel = getStatusLabel(item.status);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento do Serviço</h1>
          <p className="text-muted-foreground">{item.serviceName}</p>
        </div>
        <BackButton to="/dashboard/services" />
      </div>
      <Card className="bg-card border-border overflow-hidden sticky top-0 z-10">
        <div className="border-b border-border bg-muted/30 p-4 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{item.serviceName}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono bg-secondary px-2 py-0.5 rounded">{item.id}</span>
              </div>
            </div>
          </div>
          <Badge className={`${serviceStatusLabel === 'Concluído' ? 'bg-green-500 hover:bg-green-600' : serviceStatusLabel === 'Em andamento' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-yellow-500 hover:bg-yellow-600'} text-white border-0 px-3 py-1`}>
            {serviceStatusLabel}
          </Badge>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="font-medium">{order.clientName}</p>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Ordem de Serviço</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono bg-secondary px-2 py-0.5 rounded text-sm">{order.orderNumber}</span>
                  <Link to={`/dashboard/orders/${order.id}`}>
                    <Button variant="link" className="px-0 h-auto text-primary text-sm">
                      Ver detalhes <ArrowLeft className="w-3 h-3 ml-1 rotate-180" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
            {canManageFinancials && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Quantidade</p>
                    <p className="font-medium">{item.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Unitário</p>
                    <p className="font-medium">{formatCurrency(item.unitPrice)}</p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">Total do Item</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(item.total)}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Execução</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Início</p>
                  <p className="text-sm font-medium">{earliestStart ? formatDate(earliestStart) : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Término</p>
                  <p className="text-sm font-medium">{latestEnd ? formatDate(latestEnd) : '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duração Total</p>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {durationLabel}
                </p>
              </div>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Descrição</p>
            <div className="bg-secondary/30 p-4 rounded-md text-sm leading-relaxed border border-border/50">
              {svcDescription || '-'}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <Tabs defaultValue="collaborators">
            <TabsList>
              <TabsTrigger value="collaborators">Executores</TabsTrigger>
              <TabsTrigger value="checklists">Checklists</TabsTrigger>
              <TabsTrigger value="comments">Comentários</TabsTrigger>
            </TabsList>
            <TabsContent value="collaborators" className="mt-6">
              <div className="space-y-6">
                <div className="flex w-full gap-3">
                  <Select value={collabToAdd} onValueChange={setCollabToAdd}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecionar colaborador..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((u) => {
                        const name = `${u.user.first_name} ${u.user.last_name}`.trim() || u.user.username;
                        return (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="hero"
                    onClick={() => {
                      if (collabToAdd) {
                        createExecutor.mutate({
                          servico: Number(itemId),
                          executor: Number(collabToAdd),
                          status_execucao: 'nao_iniciado'
                        });
                      }
                      setCollabToAdd('');
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Relacionar
                  </Button>
                </div>
                <Separator className="opacity-40" />
                {(executors || []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum colaborador relacionado ainda</p>
                )}
                {(executors || []).map(c => {
                  const u = usersById[c.executor];
                  const displayName = u ? `${u.user.first_name} ${u.user.last_name}`.trim() || u.user.username : c.executor;
                  const email = u?.user.email || '';
                  const avatarSrc = u?.foto_perfil || undefined;
                  const statusClass = getStatusColor(c.status_execucao === 'concluido' ? 'completed' : c.status_execucao === 'em_andamento' ? 'in_progress' : 'pending');
                  const statusLabel = c.status_execucao === 'concluido' ? 'Concluído' : c.status_execucao === 'em_andamento' ? 'Em andamento' : 'Não iniciado';
                  return (
                    <div key={c.id} className="flex items-center justify-between p-4 rounded-md border bg-secondary">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={avatarSrc} />
                          <AvatarFallback>{(String(displayName) || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{displayName}</p>
                          <p className="text-xs text-muted-foreground">{email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${statusClass} border-0`}>{statusLabel}</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateExecutor.mutate({ id: c.id, status_execucao: 'nao_iniciado' })}>
                              <CircleDashed className="w-4 h-4 mr-2" />
                              Não iniciado
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateExecutor.mutate({ id: c.id, status_execucao: 'em_andamento' })}>
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Em andamento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateExecutor.mutate({ id: c.id, status_execucao: 'concluido' })}>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Concluído
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => removeExecutor.mutate(c.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover colaborador
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
                {canMarkOwn && myCollab && myCollab.status_execucao !== 'concluido' && (
                  <div className="flex items-center gap-3">
                    <Button onClick={() => updateExecutor.mutate({ id: myCollab.id, status_execucao: 'em_andamento' })}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Iniciar minha parte
                    </Button>
                    <Button variant="hero" onClick={() => updateExecutor.mutate({ id: myCollab.id, status_execucao: 'concluido' })}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Marcar minha parte como concluída
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="checklists" className="mt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-secondary/20 border-dashed">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Wrench className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Em desenvolvimento</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Esta funcionalidade está sendo implementada e estará disponível em breve.
                </p>
              </div>
              <div className="space-y-6 hidden">
                <div className="flex justify-start">
                  <Button
                    onClick={() => {
                      if (!itemId) return;
                      createChecklist.mutate({ servico: Number(itemId), observacao: 'Checklist' });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Nova checklist
                  </Button>
                </div>
                <Separator className="opacity-40" />
                {checklists.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum checklist criado</p>
                )}
                {checklists.map(cl => (
                  <div key={cl.id} className="p-3 rounded-md border">
                    <div className="flex items-center justify-between">
                      <Input
                        value={titles[cl.id] ?? cl.observacao}
                        onChange={(e) => setTitles({ ...titles, [cl.id]: e.target.value })}
                        onBlur={() => {
                          const nextTitle = (titles[cl.id] ?? cl.observacao).trim();
                          if (nextTitle && nextTitle !== cl.observacao) {
                            updateChecklist.mutate({ id: cl.id, observacao: nextTitle });
                          }
                        }}
                        placeholder="Título do checklist"
                        className="bg-background border rounded-md h-9 w-64"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{new Date(cl.criado_em).toLocaleString('pt-BR')}</span>
                        {cl.criado_por && (
                          <span className="text-xs text-muted-foreground">• Criado por {cl.criado_por_nome || usersById[cl.criado_por]?.user.username}</span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteChecklist.mutate(cl.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(cl.itens || []).map(it => {
                        return (
                          <div key={it.id} className="flex items-center justify-between rounded-md border bg-secondary p-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={it.concluido}
                                onChange={(e) => updateItem.mutate({ id: it.id, concluido: e.target.checked })}
                                className="h-4 w-4"
                              />
                              <span className={it.concluido ? 'line-through text-muted-foreground' : ''}>{it.descricao}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => deleteItem.mutate(it.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Input
                        placeholder="Nova tarefa..."
                        value={newItemText[cl.id] || ''}
                        onChange={(e) => setNewItemText({ ...newItemText, [cl.id]: e.target.value })}
                        className="bg-secondary border-border h-10 flex-1"
                      />
                      <Button
                        onClick={() => {
                          const text = (newItemText[cl.id] || '').trim();
                          if (text) {
                            createItem.mutate({ checklist: cl.id, descricao: text });
                            setNewItemText({ ...newItemText, [cl.id]: '' });
                          }
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Adicionar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="comments" className="mt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-secondary/20 border-dashed">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                  <Wrench className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Em desenvolvimento</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Esta funcionalidade está sendo implementada e estará disponível em breve.
                </p>
              </div>
              <div className="space-y-6 hidden">
                {comentarios.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum comentário ainda</p>
                )}
                {comentarios.map(c => {
                  const u = usersById[c.criado_por];
                  const meta = new Date(c.criado_em).toLocaleString('pt-BR');
                  return (
                    <div key={c.id} className="relative flex items-start gap-4 p-4 rounded-md border bg-secondary">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={u?.foto_perfil} />
                        <AvatarFallback>{(c.criado_por_nome || 'U').slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 pr-10">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm">{c.criado_por_nome}</span>
                        </div>
                        <p className="text-xs leading-relaxed break-words">{c.texto}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 text-destructive z-10"
                        onClick={() => deleteComentario.mutate(c.id)}
                        aria-label="Excluir comentário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <span className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">{meta}</span>
                    </div>
                  );
                })}
                <Separator className="opacity-40" />
                <div className="space-y-3">
                  <Textarea
                    placeholder="Escreva um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-secondary border-border min-h-[100px]"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => {
                        if (newComment.trim() && itemId) {
                          createComentario.mutate({ servico: Number(itemId), texto: newComment.trim() });
                          setNewComment('');
                        }
                      }}
                    >
                      Comentar
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  function newFunction() {
    const canMarkOwn = executors.some(c => c.executor === currentUser?.id);
    const myCollab = executors.find(c => c.executor === currentUser?.id);
    return { canMarkOwn, myCollab };
  }
};

export default ServiceManagementPage;
