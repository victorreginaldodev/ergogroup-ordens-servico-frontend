import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuickTaskCatalogItem, useUpsertQuickTaskCatalog } from '@/services/quickTasks';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

type FormValues = {
  nome: string;
  descricao: string;
};

const QuickTasksCatalogFormPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id ? Number(params.id) : undefined;
  const { data: catalogItem } = useQuickTaskCatalogItem(id);
  const upsert = useUpsertQuickTaskCatalog();
  const { toast } = useToast();
  const { canManageQuickTasks } = useUserRole();

  const form = useForm<FormValues>({
    defaultValues: { nome: '', descricao: '' },
  });

  useEffect(() => {
    if (!canManageQuickTasks) {
      toast({
        title: 'Permissão insuficiente',
        description: 'Seu perfil não pode gerenciar o catálogo de tarefas rápidas.',
        variant: 'destructive',
      });
      navigate('/dashboard/quick-tasks/catalog');
    }
  }, [canManageQuickTasks, navigate, toast]);

  useEffect(() => {
    if (catalogItem) {
      form.reset({
        nome: catalogItem.nome ?? '',
        descricao: catalogItem.descricao ?? '',
      });
    }
  }, [catalogItem, form]);

  const onSubmit = (values: FormValues) => {
    if (!canManageQuickTasks) return;
    upsert.mutate(
      {
        id,
        payload: {
          nome: values.nome,
          descricao: values.descricao || null,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: id ? 'Serviço atualizado' : 'Serviço criado',
            description: 'Operação concluída com sucesso.',
          });
          navigate('/dashboard/quick-tasks/catalog');
        },
        onError: () => {
          toast({
            title: 'Erro ao salvar',
            description: 'Não foi possível concluir a operação.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  const title = id ? 'Editar serviço rápido' : 'Novo serviço rápido';

  if (!canManageQuickTasks) {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            Defina as informações do serviço rápido utilizado nas MiniOS.
          </p>
        </div>
        <BackButton to="/dashboard/quick-tasks/catalog" />
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Informações do serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="Ex.: Revisão PGR - Correção Cliente"
                {...form.register('nome', { required: true })}
                className="bg-secondary border-border uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Detalhes adicionais do serviço rápido"
                rows={5}
                {...form.register('descricao')}
                className="bg-secondary border-border min-h-28"
              />
            </div>

            <Button
              type="submit"
              variant="hero"
              className="min-w-40"
              disabled={upsert.isPending || !canManageQuickTasks}
            >
              <Save className="w-4 h-4 mr-2" />
              {id ? 'Salvar alterações' : 'Adicionar serviço'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickTasksCatalogFormPage;

