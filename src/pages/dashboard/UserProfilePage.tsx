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
import { authService } from '@/services/auth';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  profileResponseToUserProfile,
  useProfileDetail,
  useUpdateProfile,
} from '@/services/profile';

const ROLE_OPTIONS = [
  { value: '1', label: 'Diretor' },
  { value: '2', label: 'Administrativo' },
  { value: '3', label: 'Líder Técnico' },
  { value: '4', label: 'Sub-Líder Técnico' },
  { value: '5', label: 'Técnico' },
];

const schema = z.object({
  username: z.string().min(2, 'Username muito curto'),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || value.length >= 6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.string().min(1, 'Selecione um papel'),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const UserProfilePage = () => {
  const [profileId, setProfileId] = useState<number | null>(null);
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', email: '', password: '', role: '1', active: true },
  });

  useEffect(() => {
    const stored = authService.getCurrentUser();
    if (stored?.id) {
      setProfileId(stored.id);
      return;
    }
    const raw = localStorage.getItem('auth_raw');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const idFromRaw = parsed?.profile?.id;
        if (typeof idFromRaw === 'number') {
          setProfileId(idFromRaw);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useProfileDetail(profileId);
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (profile) {
      form.reset({
        username: profile.user.username ?? '',
        email: profile.user.email ?? '',
        password: '',
        role: String(profile.role ?? '1'),
        active: profile.active ?? true,
      });
    }
  }, [profile, form]);

  const onSubmit = async (values: FormValues) => {
    if (!profileId) return;
    try {
      const payload = {
        user: {
          username: values.username,
          email: values.email,
          ...(values.password ? { password: values.password } : {}),
        },
        role: Number(values.role),
        active: values.active,
      };
      const updated = await updateProfile.mutateAsync({ id: profileId, payload });
      toast({
        title: 'Dados atualizados',
        description: 'Seu perfil foi atualizado com sucesso.',
      });
      const normalized = profileResponseToUserProfile(updated);
      authService.setCurrentUser(normalized);
      window.dispatchEvent(new Event('servix:auth-updated'));
    } catch (error) {
      console.error('Failed to update profile', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível salvar suas alterações.',
        variant: 'destructive',
      });
    }
  };

  const isLoading = isProfileLoading || profileId === null;
  const roleValue = form.watch('role');
  const rolePreviewLabel =
    ROLE_OPTIONS.find((option) => option.value === roleValue)?.label ||
    profile?.role_display ||
    '';
  const isActive = form.watch('active');
  const usernamePreview = form.watch('username') || profile?.user.username || 'Usuário';
  const emailPreview = form.watch('email') || profile?.user.email || '';

  const initials = useMemo(() => {
    return usernamePreview
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
  }, [usernamePreview]);

  if (isProfileError) {
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
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="w-20 h-20">
                    {null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="w-full">
                  <h2 className="text-lg font-semibold">{usernamePreview}</h2>
                  <p className="text-sm text-muted-foreground">
                    {emailPreview ? `${emailPreview} • @${usernamePreview}` : `@${usernamePreview}`}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {rolePreviewLabel && <Badge variant="secondary">{rolePreviewLabel}</Badge>}
                    <Badge
                      className={`${
                        isActive ? 'bg-green-600 text-primary-foreground' : 'bg-muted text-muted-foreground'
                      } border-0`}
                    >
                      {isActive ? 'Ativo' : 'Inativo'}
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
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="seu.username"
                                {...field}
                                disabled={updateProfile.isPending}
                              />
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
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nova senha</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••"
                                {...field}
                                disabled={updateProfile.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Função</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={updateProfile.isPending}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a função" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ROLE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                          <div className="space-y-0.5">
                            <FormLabel>Status do usuário</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Defina se o usuário está ativo na plataforma.
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={updateProfile.isPending}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
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
    </div>
  );
};

export default UserProfilePage;
