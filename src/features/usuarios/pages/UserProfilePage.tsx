import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/auth';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TIPO_USUARIO_OPTIONS, TipoUsuarioKey, profileResponseToUserProfile, AlterarSenhaPayload } from '../services';
import {
  useMyProfile,
  useUpdateProfile,
  useAlterarSenha,
} from '../hooks';

const TIPO_USUARIO_VALUES = TIPO_USUARIO_OPTIONS.map(o => o.value) as [TipoUsuarioKey, ...TipoUsuarioKey[]];

const TIPOS_NAO_GESTORES: TipoUsuarioKey[] = [
  'tecnico',
  'sub_gestor_tecnico',
  'comercial',
  'financeiro',
  'administrativo',
];

const profileSchema = z.object({
  username: z.string().min(2, 'Username muito curto'),
  nome_completo: z.string().min(1, 'Nome completo é obrigatório'),
  email: z.string().email('E-mail inválido'),
  tipo_usuario: z.enum(TIPO_USUARIO_VALUES),
  ativo: z.boolean(),
});

const senhaSchema = z
  .object({
    senha_atual: z.string().min(1, 'Informe a senha atual'),
    nova_senha: z.string().min(6, 'Nova senha deve ter ao menos 6 caracteres'),
    nova_senha_confirmacao: z.string().min(6, 'Confirmação deve ter ao menos 6 caracteres'),
  })
  .refine(v => v.nova_senha === v.nova_senha_confirmacao, {
    path: ['nova_senha_confirmacao'],
    message: 'As senhas não coincidem',
  });

type ProfileFormValues = z.infer<typeof profileSchema>;
type SenhaFormValues = z.infer<typeof senhaSchema>;

const UserProfilePage = () => {
  const { toast } = useToast();

  const { data: profile, isLoading, isError } = useMyProfile();
  const updateProfile = useUpdateProfile();
  const alterarSenha = useAlterarSenha();

  const currentUser = authService.getCurrentUser();
  const isNaoGestor = currentUser
    ? TIPOS_NAO_GESTORES.includes(currentUser.tipo_usuario as TipoUsuarioKey)
    : false;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      nome_completo: '',
      email: '',
      tipo_usuario: 'tecnico',
      ativo: true,
    },
  });

  const senhaForm = useForm<SenhaFormValues>({
    resolver: zodResolver(senhaSchema),
    defaultValues: { senha_atual: '', nova_senha: '', nova_senha_confirmacao: '' },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        username: profile.username ?? '',
        nome_completo: profile.nome_completo ?? '',
        email: profile.email ?? '',
        tipo_usuario: profile.tipo_usuario ?? 'tecnico',
        ativo: profile.ativo ?? true,
      });
    }
  }, [profile]);

  const onSubmitProfile = async (values: ProfileFormValues) => {
    if (!profile) return;
    try {
      const payload = {
        username: values.username,
        nome_completo: values.nome_completo,
        email: values.email,
        tipo_usuario: isNaoGestor ? profile.tipo_usuario : values.tipo_usuario,
        ativo: isNaoGestor ? profile.ativo : values.ativo,
      };
      const updated = await updateProfile.mutateAsync({ id: profile.id, payload });
      toast({ title: 'Dados atualizados', description: 'Seu perfil foi atualizado com sucesso.' });
      authService.setCurrentUser(profileResponseToUserProfile(updated));
      window.dispatchEvent(new Event('servix:auth-updated'));
    } catch {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar suas alterações.',
        variant: 'destructive',
      });
    }
  };

  const onSubmitSenha = async (values: SenhaFormValues) => {
    if (!profile) return;
    try {
      await alterarSenha.mutateAsync({ id: profile.id, payload: values as AlterarSenhaPayload });
      toast({ title: 'Senha alterada', description: 'Sua senha foi atualizada com sucesso.' });
      senhaForm.reset();
    } catch {
      toast({
        title: 'Erro ao alterar senha',
        description: 'Verifique se a senha atual está correta.',
        variant: 'destructive',
      });
    }
  };

  const tipoUsuarioLabel = profileForm.watch('tipo_usuario');
  const tipoLabel =
    TIPO_USUARIO_OPTIONS.find(o => o.value === tipoUsuarioLabel)?.label ||
    profile?.tipo_usuario_display ||
    '';
  const isAtivo = profileForm.watch('ativo');
  const usernamePreview = profileForm.watch('username') || profile?.username || 'Usuário';
  const emailPreview = profileForm.watch('email') || profile?.email || '';

  const initials = useMemo(
    () =>
      usernamePreview
        .split(' ')
        .filter(Boolean)
        .map(part => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'U',
    [usernamePreview],
  );

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Não foi possível carregar suas informações. Tente novamente mais tarde.
          </p>
        </div>
      </div>
    );
  }

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
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32 ml-auto" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                  <h2 className="text-lg font-semibold">{usernamePreview}</h2>
                  <p className="text-sm text-muted-foreground">
                    {emailPreview ? `${emailPreview} • @${usernamePreview}` : `@${usernamePreview}`}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {tipoLabel && <Badge variant="secondary">{tipoLabel}</Badge>}
                    <Badge
                      className={`${isAtivo ? 'bg-green-600 text-primary-foreground' : 'bg-muted text-muted-foreground'} border-0`}
                    >
                      {isAtivo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Form {...profileForm}>
                <form className="space-y-8" onSubmit={profileForm.handleSubmit(onSubmitProfile)}>
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Dados Pessoais</h3>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="seu.username" {...field} disabled={updateProfile.isPending} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="nome_completo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu Nome" {...field} disabled={updateProfile.isPending} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="seu@email.com"
                                {...field}
                                disabled={updateProfile.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="tipo_usuario"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Função</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={updateProfile.isPending || isNaoGestor}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a função" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TIPO_USUARIO_OPTIONS.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isNaoGestor && (
                              <p className="text-sm text-muted-foreground">
                                Apenas gestores podem alterar o tipo de usuário.
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="ativo"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                          <div className="space-y-0.5">
                            <FormLabel>Status do usuário</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              {isNaoGestor
                                ? 'Apenas gestores podem alterar o status.'
                                : 'Defina se o usuário está ativo na plataforma.'}
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={updateProfile.isPending || isNaoGestor}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" className="min-w-32" disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Alterar Senha</h3>
            <Separator />
            <Form {...senhaForm}>
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                onSubmit={senhaForm.handleSubmit(onSubmitSenha)}
              >
                <FormField
                  control={senhaForm.control}
                  name="senha_atual"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Senha atual</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          {...field}
                          disabled={alterarSenha.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={senhaForm.control}
                  name="nova_senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...field}
                          disabled={alterarSenha.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={senhaForm.control}
                  name="nova_senha_confirmacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar nova senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          {...field}
                          disabled={alterarSenha.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="outline"
                    className="min-w-32"
                    disabled={alterarSenha.isPending}
                  >
                    {alterarSenha.isPending ? 'Alterando...' : 'Alterar senha'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
