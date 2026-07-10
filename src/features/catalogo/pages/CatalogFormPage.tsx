import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCatalogo, useUpsertCatalogo } from '../hooks';
import { Complexidade, COMPLEXIDADE_LABEL } from '../services';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

type FormValues = {
  nome: string;
  descricao: string;
  horasEstimadas: string;
  complexidade: string;
};

const CatalogFormPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id ? Number(params.id) : undefined;
  const { data: catalogo } = useCatalogo(id);
  const upsert = useUpsertCatalogo();
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
      navigate('/catalogo');
    }
  }, [isTechnician, navigate, toast]);

  const form = useForm<FormValues>({
    defaultValues: { nome: '', descricao: '', horasEstimadas: '', complexidade: '' },
  });

  useEffect(() => {
    if (catalogo) {
      form.reset({
        nome: catalogo.nome,
        descricao: catalogo.descricao ?? '',
        horasEstimadas: catalogo.horasEstimadas ?? '',
        complexidade: catalogo.complexidade ? String(catalogo.complexidade) : '',
      });
    }
  }, [catalogo]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      nome: values.nome,
      descricao: values.descricao || null,
      horasEstimadas: values.horasEstimadas || null,
      complexidade: values.complexidade ? (Number(values.complexidade) as Complexidade) : null,
    };
    upsert.mutate(
      { id, payload },
      {
        onSuccess: () => {
          toast({ title: id ? 'Serviço atualizado' : 'Serviço criado', description: 'Operação realizada com sucesso.' });
          navigate('/catalogo');
        },
        onError: () => {
          toast({ title: 'Erro', description: 'Não foi possível salvar.', variant: 'destructive' });
        },
      },
    );
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
          <p className="text-muted-foreground">Preencha os dados do serviço de catálogo</p>
        </div>
        <BackButton to="/catalogo" />
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Dados do Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome</Label>
                <Input
                  placeholder="Nome do serviço"
                  maxLength={100}
                  {...form.register('nome', { required: true })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descrição"
                  rows={4}
                  {...form.register('descricao')}
                  className="bg-secondary border-border min-h-28"
                />
              </div>
              <div className="space-y-2">
                <Label>Horas estimadas</Label>
                <Input
                  placeholder="Ex.: 4.5"
                  {...form.register('horasEstimadas')}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Complexidade</Label>
                <Select
                  value={form.watch('complexidade')}
                  onValueChange={(v) => form.setValue('complexidade', v)}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COMPLEXIDADE_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
