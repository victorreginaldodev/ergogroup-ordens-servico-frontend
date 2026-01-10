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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useDeleteUser, useUpsertUser, useUsers, TIPO_USUARIO_OPTIONS, CreateUserPayload, UpdateUserPayload, TipoUsuarioKey } from '@/services/users';
import { MoreVertical, Edit, Trash2, User as UserIcon, Plus, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { authService, UserProfile } from '@/services/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const schema = z
  .object({
    id: z.number().optional(),
    username: z.string().min(2, 'Username muito curto'),
    password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres').optional().or(z.literal('')),
    email: z.string().email('E-mail inválido'),
    roleId: z.number().int().min(1).max(5),
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

const UsersManagementPage = () => {
  const { data: users = [] } = useUsers();
  const upsert = useUpsertUser();
  const del = useDeleteUser();
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [open, setOpen] = useState(false);
  const currentUser = authService.getCurrentUser();
  const canManageUsers = !!currentUser && currentUser.tipo_usuario !== 'tecnico';
  
  // Filtros
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterNivel, setFilterNivel] = useState<string>('all');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      roleId: 5,
      ativo: true,
    },
  });

  useEffect(() => {
    if (editing) {
      const ROLE_ID_MAP: Record<string, number> = {
        diretor: 1,
        administrativo: 2,
        lider_tecnico: 3,
        sub_lider_tecnico: 4,
        tecnico: 5,
      };
      form.reset({
        id: editing.id,
        username: editing.user.username,
        email: editing.user.email,
        roleId: ROLE_ID_MAP[editing.tipo_usuario] ?? 5,
        ativo: editing.ativo ?? true,
        password: '',
      });
    } else {
      form.reset({
        username: '',
        password: '',
        email: '',
        roleId: 5,
        ativo: true,
      });
    }
  }, [editing]);

  const onSubmit = (values: FormValues) => {
    if (!canManageUsers) return;

    if (values.id) {
      const payload: UpdateUserPayload & { id: number } = {
        id: values.id,
        username: values.username,
        email: values.email,
        roleId: values.roleId,
        ativo: values.ativo,
        password: values.password || undefined,
      };

      upsert.mutate(payload, {
        onSuccess: () => {
          setEditing(null);
          form.reset({
            username: '',
            password: '',
            email: '',
            roleId: 5,
            ativo: true,
          });
          setOpen(false);
        },
      });
    } else {
      const payload: CreateUserPayload = {
        username: values.username,
        password: values.password || '', // Password is required for creation
        email: values.email,
        roleId: values.roleId,
        ativo: values.ativo,
      };

      upsert.mutate(payload, {
        onSuccess: () => {
          setEditing(null);
          form.reset({
            username: '',
            password: '',
            email: '',
            roleId: 5,
            ativo: true,
          });
          setOpen(false);
        },
      });
    }
  };

  const tipoLabel = (key: string) => {
    const found = TIPO_USUARIO_OPTIONS.find(o => o.value === key)?.label || key;
    const base = (found || '').toString();
    return base ? base[0].toUpperCase() + base.slice(1).toLowerCase() : '';
  };

  const fullName = (u: UserProfile) => {
    const fn = u.user.first_name?.trim() || '';
    const ln = u.user.last_name?.trim() || '';
    const n = `${fn} ${ln}`.trim();
    return n || u.user.username;
  };

  const avatarUrl = (u: UserProfile) => u.foto_perfil || '';

  const filteredUsers = users.filter(u => {
    const s = search.toLowerCase();
    const matchesSearch = s === '' || 
      u.user.username.toLowerCase().includes(s) ||
      u.user.email.toLowerCase().includes(s) ||
      fullName(u).toLowerCase().includes(s);
    
    const matchesTipo = filterTipo === 'all' || u.tipo_usuario === filterTipo;
    const matchesNivel = filterNivel === 'all' || u.nivel_usuario === filterNivel;
    
    return matchesSearch && matchesTipo && matchesNivel;
  });

  const [page, setPage] = useState(1);
  const pageSize = 10;
  const sortedUsers = [...filteredUsers].sort((a, b) =>
    fullName(a).localeCompare(fullName(b), 'pt-BR', { sensitivity: 'base' })
  );
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageUsers = sortedUsers.slice(startIndex, endIndex);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
    if (page > tp) setPage(tp);
    if (page < 1) setPage(1);
  }, [sortedUsers.length]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
          <Button
            onClick={() => {
              if (!canManageUsers) return;
              setEditing(null);
              form.reset({
                username: '',
                password: '',
                email: '',
                roleId: 5,
                ativo: true,
              });
              setOpen(true);
            }}
            variant="hero"
            disabled={!canManageUsers}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo usuário
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome de usuário..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Usuário' : 'Adicionar Usuário'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha {editing ? '(opcional)' : ''}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
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
                      <Input type="email" placeholder="email@dominio.com" autoComplete="off" autoCapitalize="none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Usuário</FormLabel>
                    <FormControl>
                      <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Diretor</SelectItem>
                          <SelectItem value="2">Administrativo</SelectItem>
                          <SelectItem value="3">Líder Técnico</SelectItem>
                          <SelectItem value="4">Sub-Líder Técnico</SelectItem>
                          <SelectItem value="5">Técnico</SelectItem>
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
                <Button type="submit" className="min-w-32" disabled={!canManageUsers}>{editing ? 'Salvar' : 'Adicionar'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Nome de usuário</TableHead>
                <TableHead>Tipo de usuário</TableHead>
                <TableHead>Status</TableHead>
                {canManageUsers && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageUsers.map(u => (
                <TableRow key={u.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center">
                        {avatarUrl(u) ? (
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={avatarUrl(u)} alt={fullName(u)} />
                            <AvatarFallback>
                              <UserIcon className="w-6 h-6 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              <UserIcon className="w-6 h-6 text-muted-foreground" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </span>
                      <div>
                        <p className="font-medium">{u.user.username}</p>
                        <p className="text-sm text-muted-foreground">{u.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{tipoLabel(u.tipo_usuario)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${u.ativo ? 'bg-green-600 text-primary-foreground' : 'bg-muted text-muted-foreground'} border-0`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  {canManageUsers && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(u); setOpen(true); }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => del.mutate(u.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
          {users.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou adicionar um usuário
              </p>
              <Button
                variant="hero"
                onClick={() => {
                  if (!canManageUsers) return;
                  setEditing(null);
              form.reset({
                username: '',
                password: '',
                email: '',
                roleId: 5,
                ativo: true,
              });
              setOpen(true);
            }}
                disabled={!canManageUsers}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo usuário
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersManagementPage;
