import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRepositories, useUpsertRepository, useRepository } from '../hooks';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

type FormValues = {
  id?: string;
  name?: string;
  description?: string;
};

const CatalogFormPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;
  const { data: repos = [] } = useRepositories();
  const { data: repoById } = useRepository(id);
  const upsert = useUpsertRepository();
  const { toast } = useToast();
  const { role } = useUserRole();
  const isTechnician = role === 'tecnico';

  useEffect(() => {
    if (isTechnician) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para gerenciar o catálogo de serviços.',
        variant: 'destructive',
      });
      navigate('/dashboard/catalog');
    }
  }, [isTechnician, navigate, toast]);

  const form = useForm<FormValues>({
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (id) {
      const source = repoById || repos.find(r => r.id === id);
      if (source) {
        form.reset({
          id: source.id,
          name: source.name,
          description: source.description,
        });
      }
    }
  }, [id, repos, repoById]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      id: id,
      name: values.name || '',
      description: values.description || '',
    };
    upsert.mutate(payload, {
      onSuccess: () => {
        toast({ title: id ? 'Repositório atualizado' : 'Repositório criado', description: 'Operação realizada com sucesso.' });
        navigate('/dashboard/catalog');
      },
      onError: () => {
        toast({ title: 'Erro', description: 'Não foi possível salvar.', variant: 'destructive' });
      },
    });
  };

  const title = id ? 'Editar serviço' : 'Novo serviço';

  if (isTechnician) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">Preencha os dados do repositório</p>
        </div>
        <BackButton to="/dashboard/catalog" />
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Dados do Repositório</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome</Label>
                <Input
                  placeholder="Nome do repositório"
                  {...form.register('name')}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descrição"
                  rows={4}
                  {...form.register('description')}
                  className="bg-secondary border-border min-h-28"
                />
              </div>
            </div>

            <Button type="submit" variant="hero" className="min-w-40" disabled={upsert.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {id ? 'Salvar' : 'Adicionar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CatalogFormPage;
