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
import { MoreVertical, Edit, Trash2, User as UserIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserProfile } from '@/services/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const schema = z
  .object({
    id: z.number().optional(),
    username: z.string().min(2, 'Username muito curto'),
    password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres').optional().or(z.literal('')),
    email: z.string().email('E-mail inválido'),
    first_name: z.string().min(1, 'Nome obrigatório'),
    last_name: z.string().min(1, 'Sobrenome obrigatório'),
    tipo_usuario: z.enum([
      'admin_geral',
      'financeiro',
      'comercial',
      'admin_tecnico',
      'sub_admin_tecnico',
      'operacional',
    ]),
    ativo: z.boolean().optional(),
    foto_perfil: z.any().optional(),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      first_name: '',
      last_name: '',
      tipo_usuario: 'operacional',
      ativo: true,
      foto_perfil: undefined,
    },
  });

  useEffect(() => {
    if (editing) {
      form.reset({
        id: editing.id,
        username: editing.user.username,
        email: editing.user.email,
        first_name: editing.user.first_name,
        last_name: editing.user.last_name,
        tipo_usuario: (editing.tipo_usuario as TipoUsuarioKey) || 'operacional',
        ativo: editing.ativo ?? true,
        password: '',
        foto_perfil: undefined,
      });
    } else {
      form.reset({
        username: '',
        password: '',
        email: '',
        first_name: '',
        last_name: '',
        tipo_usuario: 'operacional',
        ativo: true,
        foto_perfil: undefined,
      });
    }
  }, [editing]);

  const onSubmit = (values: FormValues) => {
    const fotoFile = (values.foto_perfil as FileList | undefined)?.[0] ?? null;

    if (values.id) {
      const payload: UpdateUserPayload & { id: number } = {
        id: values.id,
        username: values.username,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        tipo_usuario: values.tipo_usuario as TipoUsuarioKey,
        ativo: values.ativo ?? true,
        foto_perfil: fotoFile || undefined,
        password: values.password || undefined,
      };

      upsert.mutate(payload, {
        onSuccess: () => {
          setEditing(null);
          form.reset({
            username: '',
            password: '',
            email: '',
            first_name: '',
            last_name: '',
            tipo_usuario: 'operacional',
            ativo: true,
            foto_perfil: undefined,
          });
          setOpen(false);
        },
      });
    } else {
      const payload: CreateUserPayload = {
        username: values.username,
        password: values.password || '', // Password is required for creation
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        tipo_usuario: values.tipo_usuario as TipoUsuarioKey,
        ativo: values.ativo ?? true,
        foto_perfil: fotoFile || undefined,
      };

      upsert.mutate(payload, {
        onSuccess: () => {
          setEditing(null);
          form.reset({
            username: '',
            password: '',
            email: '',
            first_name: '',
            last_name: '',
            tipo_usuario: 'operacional',
            ativo: true,
            foto_perfil: undefined,
          });
          setOpen(false);
        },
      });
    }
  };

  const filteredUsers = users;

  const tipoLabel = (key: string) => {
    const found = TIPO_USUARIO_OPTIONS.find(o => o.value === key);
    return found ? found.label : key;
  };

  const fullName = (u: UserProfile) => {
    const fn = u.user.first_name?.trim() || '';
    const ln = u.user.last_name?.trim() || '';
    const n = `${fn} ${ln}`.trim();
    return n || u.user.username;
  };

  const avatarUrl = (u: UserProfile) => u.foto_perfil || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuários</h1>
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
          <Button
            onClick={() => {
              setEditing(null);
              form.reset({
                username: '',
                password: '',
                email: '',
                first_name: '',
                last_name: '',
                tipo_usuario: 'operacional',
                ativo: true,
                foto_perfil: undefined,
              });
              setOpen(true);
            }}
            variant="hero"
          >
            Novo usuário
          </Button>
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
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="João" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobrenome</FormLabel>
                    <FormControl>
                      <Input placeholder="Silva" {...field} />
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
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
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
              <FormField
                control={form.control}
                name="foto_perfil"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Foto de Perfil</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => field.onChange(e.target.files)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="min-w-32">{editing ? 'Salvar' : 'Adicionar'}</Button>
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
                <TableHead>Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(u => (
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
                        <p className="font-medium">{fullName(u)}</p>
                        <p className="text-sm text-muted-foreground hidden sm:block">{u.user.email}</p>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                  setEditing(null);
                  form.reset({
                    username: '',
                    password: '',
                    email: '',
                    first_name: '',
                    last_name: '',
                    tipo_usuario: 'operacional',
                    ativo: true,
                    foto_perfil: undefined,
                  });
                  setOpen(true);
                }}
              >
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
