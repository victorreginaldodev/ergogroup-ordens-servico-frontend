import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useDeleteUser, useProfileDetail, useUpsertUser, useUsers } from '../hooks';
import {
  TIPO_USUARIO_OPTIONS,
  CreateUserPayload,
  UpdateUserPayload,
  TipoUsuarioKey,
  UsuarioApi,
} from '../services';
import { MoreVertical, Edit, Trash2, User as UserIcon, Plus, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { authService } from '@/services/auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const PAGE_SIZE = 10;

const TIPO_USUARIO_VALUES = TIPO_USUARIO_OPTIONS.map(o => o.value) as [TipoUsuarioKey, ...TipoUsuarioKey[]];

// Endpoints de criação/exclusão/ativação de usuário exigem "perfil Gestor ou
// superior" (api-schema.yaml). Sub-Líder Técnico e papéis operacionais (comercial,
// financeiro, administrativo, técnico) não se qualificam — mostrar os controles de
// gestão pra eles só resulta num 403 silencioso do backend.
const MANAGER_ROLES = new Set<TipoUsuarioKey>([
  'diretor',
  'gestor_comercial',
  'gestor_tecnico',
  'gestor_financeiro',
  'gestor_administrativo',
]);

const schema = z
  .object({
    id: z.number().optional(),
    username: z.string().min(2, 'Username muito curto'),
    nome_completo: z.string().min(1, 'Nome completo é obrigatório'),
    password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres').optional().or(z.literal('')),
    email: z.string().email('E-mail inválido'),
    tipo_usuario: z.enum(TIPO_USUARIO_VALUES),
    ativo: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (!val.id && (!val.password || val.password.length < 6)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Senha é obrigatória na criação',
      });
    }
  });

type FormValues = z.infer<typeof schema>;

// Extrai uma mensagem legível do corpo de erro do DRF, que costuma vir como
// `{ detail: "..." }` (403/permissão) ou `{ campo: ["mensagem", ...] }` (400/validação).
const extractErrorMessage = (error: unknown, fallback: string): string => {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (!data || typeof data !== 'object') return fallback;
  const obj = data as Record<string, unknown>;
  if (typeof obj.detail === 'string') return obj.detail;
  const firstField = Object.values(obj).find((v) => Array.isArray(v) && typeof v[0] === 'string');
  if (Array.isArray(firstField)) return firstField[0] as string;
  return fallback;
};

const defaultValues: FormValues = {
  username: '',
  nome_completo: '',
  password: '',
  email: '',
  tipo_usuario: 'tecnico',
  ativo: true,
};

const UsersManagementPage = () => {
  const { toast } = useToast();
  const { data: users = [], isLoading } = useUsers();
  const upsert = useUpsertUser();
  const del = useDeleteUser();
  const [editingId, setEditingId] = useState<number | null>(null);
  const { data: editingDetail } = useProfileDetail(editingId);
  const [open, setOpen] = useState(false);
  const currentUser = authService.getCurrentUser();
  const canManageUsers = !!currentUser && MANAGER_ROLES.has(currentUser.tipo_usuario as TipoUsuarioKey);

  const [search, setSearch] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // O endpoint de listagem não retorna username — ao editar, buscamos o detalhe
  // completo do usuário (`useProfileDetail`) e só então preenchemos o formulário.
  useEffect(() => {
    if (editingId && editingDetail) {
      form.reset({
        id: editingDetail.id,
        username: editingDetail.username,
        nome_completo: editingDetail.nome_completo,
        email: editingDetail.email,
        tipo_usuario: editingDetail.tipo_usuario,
        ativo: editingDetail.ativo ?? true,
        password: '',
      });
    } else if (!editingId) {
      form.reset(defaultValues);
    }
  }, [editingId, editingDetail]);

  const onSubmit = (values: FormValues) => {
    if (!canManageUsers) return;

    if (values.id) {
      const payload: UpdateUserPayload & { id: number } = {
        id: values.id,
        username: values.username,
        nome_completo: values.nome_completo,
        email: values.email,
        tipo_usuario: values.tipo_usuario,
        ativo: values.ativo,
      };
      upsert.mutate(payload, {
        onSuccess: () => {
          toast({ title: 'Usuário atualizado', description: 'As alterações foram salvas com sucesso.' });
          setEditingId(null);
          form.reset(defaultValues);
          setOpen(false);
        },
        onError: (error) => {
          toast({
            title: 'Erro ao atualizar usuário',
            description: extractErrorMessage(error, 'Não foi possível salvar as alterações.'),
            variant: 'destructive',
          });
        },
      });
    } else {
      const payload: CreateUserPayload = {
        username: values.username,
        nome_completo: values.nome_completo,
        password: values.password || '',
        password_confirmacao: values.password || '',
        email: values.email,
        tipo_usuario: values.tipo_usuario,
        ativo: values.ativo,
      };
      upsert.mutate(payload, {
        onSuccess: () => {
          toast({ title: 'Usuário criado', description: 'O novo usuário foi cadastrado com sucesso.' });
          setEditingId(null);
          form.reset(defaultValues);
          setOpen(false);
        },
        onError: (error) => {
          toast({
            title: 'Erro ao criar usuário',
            description: extractErrorMessage(error, 'Não foi possível criar o usuário.'),
            variant: 'destructive',
          });
        },
      });
    }
  };

  const tipoLabel = (key: string) =>
    TIPO_USUARIO_OPTIONS.find(o => o.value === key)?.label || key;

  const displayName = (u: UsuarioApi) => u.nome_completo?.trim() || u.email;

  const filteredUsers = users.filter(u => {
    const s = search.toLowerCase();
    return (
      s === '' ||
      (u.email || '').toLowerCase().includes(s) ||
      (u.nome_completo || '').toLowerCase().includes(s)
    );
  });

  const [page, setPage] = useState(1);
  const sortedUsers = [...filteredUsers].sort((a, b) =>
    displayName(a).localeCompare(displayName(b), 'pt-BR', { sensitivity: 'base' }),
  );
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageUsers = sortedUsers.slice(startIndex, startIndex + PAGE_SIZE);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE));
    if (page > tp) setPage(tp);
    if (page < 1) setPage(1);
  }, [sortedUsers.length]);

  const openCreate = () => {
    if (!canManageUsers) return;
    setEditingId(null);
    form.reset(defaultValues);
    setOpen(true);
  };

  const openEdit = (u: UsuarioApi) => {
    setEditingId(u.id);
    setOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold">Usuários</h1>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {isLoading ? 'carregando…' : `${users.length} ${users.length === 1 ? 'usuário' : 'usuários'}`}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">Gerencie os usuários do sistema</p>
        </div>
        <Button onClick={openCreate} variant="hero" disabled={!canManageUsers}>
          <Plus className="w-4 h-4" />
          Novo usuário
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card border-border h-11 rounded-[11px] text-sm"
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Usuário' : 'Adicionar Usuário'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              onSubmit={form.handleSubmit(onSubmit)}
              autoComplete="off"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="joao.silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nome_completo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@dominio.com"
                        autoComplete="off"
                        autoCapitalize="none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha {editingId ? '(opcional)' : ''}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo_usuario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Usuário</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPO_USUARIO_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ativo</FormLabel>
                    <FormControl>
                      <div className="h-10 flex items-center">
                        <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="min-w-32" disabled={!canManageUsers}>
                  {editingId ? 'Salvar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 min-w-[260px]">Usuário</TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[180px]">Tipo de usuário</TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[110px]">Status</TableHead>
                  {canManageUsers && <TableHead className="py-2 px-3 w-[40px]" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                      <TableRow key={`skeleton-${idx}`} className="border-border">
                        <TableCell className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="space-y-1.5">
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-3 w-32" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3"><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                        <TableCell className="py-3 px-3"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        {canManageUsers && <TableCell className="py-3 px-3" />}
                      </TableRow>
                    ))
                  : pageUsers.map(u => (
                      <TableRow
                        key={u.id}
                        className={`border-border hover:bg-muted/40 transition-colors group ${canManageUsers ? 'cursor-pointer' : ''}`}
                        onClick={canManageUsers ? () => openEdit(u) : undefined}
                      >
                        <TableCell className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>
                                <UserIcon className="w-5 h-5 text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold">{displayName(u)}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          <Badge variant="secondary">{tipoLabel(u.tipo_usuario)}</Badge>
                        </TableCell>
                        <TableCell className="py-3 px-3">
                          <Badge
                            className={`${u.ativo ? 'bg-green-600 text-primary-foreground' : 'bg-muted text-muted-foreground'} border-0`}
                          >
                            {u.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        {canManageUsers && (
                          <TableCell className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(u)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => del.mutate(u.id, {
                                    onSuccess: () => toast({ title: 'Usuário excluído', description: 'O usuário foi removido com sucesso.' }),
                                    onError: (error) => toast({
                                      title: 'Erro ao excluir usuário',
                                      description: extractErrorMessage(error, 'Não foi possível excluir o usuário.'),
                                      variant: 'destructive',
                                    }),
                                  })}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                }
              </TableBody>
            </Table>
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
                    const items: (number | 'ellipsis')[] = [];
                    if (totalPages <= 7) {
                      for (let p = 1; p <= totalPages; p++) items.push(p);
                    } else {
                      items.push(1);
                      const left = Math.max(page - siblingCount, 2);
                      const right = Math.min(page + siblingCount, totalPages - 1);
                      if (left > 2) items.push('ellipsis');
                      for (let p = left; p <= right; p++) items.push(p);
                      if (right < totalPages - 1) items.push('ellipsis');
                      items.push(totalPages);
                    }
                    return items.map((it, idx) => (
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

          {!isLoading && pageUsers.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                {search ? 'Ajuste a busca acima para encontrar um usuário.' : 'Adicione um novo usuário para começar.'}
              </p>
              {search ? (
                <Button variant="outline" onClick={() => setSearch('')}>
                  Limpar busca
                </Button>
              ) : (
                <Button variant="hero" onClick={openCreate} disabled={!canManageUsers}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo usuário
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersManagementPage;
