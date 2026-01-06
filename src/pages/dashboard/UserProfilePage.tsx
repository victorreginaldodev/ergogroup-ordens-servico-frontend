import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { authService, UserProfile as BackendUserProfile } from '@/services/auth';
import { useUpsertUser } from '@/services/users';
import { Badge } from '@/components/ui/badge';
import { TIPO_USUARIO_OPTIONS } from '@/services/users';

const schema = z.object({
  username: z.string().min(2, 'Username muito curto'),
  email: z.string().email('E-mail inválido'),
  first_name: z.string().min(1, 'Nome obrigatório'),
  last_name: z.string().min(1, 'Sobrenome obrigatório'),
  foto_perfil: z.any().optional(),
});

type FormValues = z.infer<typeof schema>;

const UserProfilePage = () => {
  const [user, setUser] = useState<BackendUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const updateUser = useUpsertUser();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', email: '', first_name: '', last_name: '', foto_perfil: undefined },
  });

  useEffect(() => {
    const u = authService.getCurrentUser();
    if (u) {
      setUser(u);
      form.reset({
        username: u.user.username || '',
        email: u.user.email || '',
        first_name: u.user.first_name || '',
        last_name: u.user.last_name || '',
        foto_perfil: undefined,
      });
    }
    setIsLoading(false);
  }, []);

  const onSubmit = (values: FormValues) => {
    if (!user) return;
    const fotoFile = (values.foto_perfil as FileList | undefined)?.[0] ?? undefined;
    updateUser.mutate(
      {
        id: user.id,
        username: values.username,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        foto_perfil: fotoFile,
      },
      {
      onSuccess: (updated) => {
        toast({
          title: 'Dados atualizados',
          description: 'Seu perfil foi atualizado com sucesso.',
        });
        authService.setCurrentUser(updated as any);
        window.dispatchEvent(new Event('servix:auth-updated'));
        setUser(updated as any);
      },
      onError: () => {
        toast({
          title: 'Erro ao atualizar',
          description: 'Não foi possível salvar suas alterações.',
          variant: 'destructive',
        });
      },
    });
  };

  const selectedFile = form.watch('foto_perfil') as FileList | undefined;
  const avatarSrc = useMemo(() => {
    const file = selectedFile?.[0];
    if (file) return URL.createObjectURL(file);
    return user?.foto_perfil || '';
  }, [selectedFile, user]);
  const displayName = `${user?.user.first_name || ''} ${user?.user.last_name || ''}`.trim() || user?.user.username || 'U';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const tipoLabel = (key?: string | null) => {
    if (!key) return '';
    return TIPO_USUARIO_OPTIONS.find(o => o.value === key)?.label || key;
  };

  

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground">Atualize seus dados pessoais</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-20 h-20 rounded-full" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-32 ml-auto" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="w-20 h-20">
                    {avatarSrc ? <AvatarImage src={avatarSrc} /> : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="w-full">
                  <h2 className="text-lg font-semibold">{`${user?.user.first_name || ''} ${user?.user.last_name || ''}`.trim() || user?.user.username}</h2>
                  <p className="text-sm text-muted-foreground">{`${user?.user.email || ''} • @${user?.user.username || ''}`}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {!!user?.tipo_usuario && <Badge variant="secondary">{tipoLabel(user?.tipo_usuario)}</Badge>}
                    <Badge className={`${user?.ativo ? 'bg-green-600 text-primary-foreground' : 'bg-muted text-muted-foreground'} border-0`}>
                      {user?.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>
              <Form {...form}>
                <form className="space-y-8" onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Dados Pessoais</h3>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome" {...field} disabled={updateUser.isPending} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} disabled={updateUser.isPending} />
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
                              <Input placeholder="Seu sobrenome" {...field} disabled={updateUser.isPending} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="seu.username" {...field} disabled={updateUser.isPending} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Avatar</h3>
                    <Separator />
                    <FormField
                      control={form.control}
                      name="foto_perfil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Foto de Perfil</FormLabel>
                          <FormControl>
                            <Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files)} disabled={updateUser.isPending} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  

                  <div className="flex justify-end gap-2">
                    <Button type="submit" className="min-w-32" disabled={updateUser.isPending}>
                      {updateUser.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
