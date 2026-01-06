import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useServicesCatalog, useUpsertService, useServiceById } from '@/services/catalog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';

type FormValues = {
  id?: string;
  name?: string;
  description?: string;
  price?: string | number;
  nao_faturavel?: boolean;
};

const CatalogFormPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;
  const { data: services = [] } = useServicesCatalog();
  const { data: serviceById, isLoading: loadingById } = useServiceById(id);
  const upsert = useUpsertService();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    defaultValues: { name: '', description: '', price: 0, nao_faturavel: false },
  });

  useEffect(() => {
    if (id) {
      const source = serviceById || services.find(s => s.id === id);
      if (source) {
        form.reset({
          id: source.id,
          name: source.name,
          description: source.description,
          price: source.price,
          nao_faturavel: !!source.nao_faturavel,
        });
      }
    }
  }, [id, services, serviceById]);

  const normalizePrice = (v: unknown) => {
    let s = String(v ?? '').trim().replace(/,/g, '.');
    const dots = (s.match(/\./g) || []).length;
    if (dots > 1) {
      const last = s.lastIndexOf('.');
      s = s.slice(0, last).replace(/\./g, '') + s.slice(last);
    }
    const n = Number(s);
    return Number.isNaN(n) ? 0 : n;
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      id: id,
      name: values.name || '',
      description: values.description || '',
      price: typeof values.price === 'number' ? values.price : normalizePrice(values.price),
      nao_faturavel: !!values.nao_faturavel,
    };
    upsert.mutate(payload, {
      onSuccess: () => {
        toast({ title: id ? 'Serviço atualizado' : 'Serviço criado', description: 'Operação realizada com sucesso.' });
        navigate('/dashboard/catalog');
      },
      onError: () => {
        toast({ title: 'Erro', description: 'Não foi possível salvar.', variant: 'destructive' });
      },
    });
  };

  const title = id ? 'Editar Serviço do Catálogo' : 'Novo Serviço do Catálogo';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <BackButton to="/dashboard/catalog" />
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">Preencha os dados do serviço</p>
        </div>
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
                  {...form.register('name')}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Descrição"
                  {...form.register('description')}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço</Label>
                <Input
                  placeholder="0,00"
                  inputMode="decimal"
                  {...form.register('price')}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Não faturável</Label>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!form.watch('nao_faturavel')}
                    onCheckedChange={(v) => form.setValue('nao_faturavel', v)}
                  />
                </div>
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
