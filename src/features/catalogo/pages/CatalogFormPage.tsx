import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useCatalogo,
  useUpsertCatalogo,
  useSubitensCatalogo,
  useUpsertSubitemCatalogo,
  useDeleteSubitemCatalogo,
} from '../hooks';
import { Complexidade, COMPLEXIDADE_LABEL } from '../services';
import { useToast } from '@/hooks/use-toast';
import { Plus, Save, Trash2 } from 'lucide-react';
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
      navigate('/dashboard/catalog');
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
        onSuccess: (created) => {
          toast({ title: id ? 'Serviço atualizado' : 'Serviço criado', description: 'Operação realizada com sucesso.' });
          if (id) {
            navigate('/dashboard/catalog');
          } else {
            navigate(`/dashboard/catalog/${created.id}/edit`);
          }
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
        <BackButton to="/dashboard/catalog" />
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

      {id && <SubitensSection catalogoId={id} />}
    </div>
  );
};

const SubitensSection = ({ catalogoId }: { catalogoId: number }) => {
  const { data: subitens = [] } = useSubitensCatalogo(catalogoId);
  const upsertSubitem = useUpsertSubitemCatalogo();
  const deleteSubitem = useDeleteSubitemCatalogo();
  const { toast } = useToast();
  const [novoNome, setNovoNome] = useState('');

  const handleAdd = () => {
    if (!novoNome.trim()) return;
    upsertSubitem.mutate(
      { payload: { nome: novoNome.trim(), catalogo: catalogoId } },
      {
        onSuccess: () => setNovoNome(''),
        onError: () => toast({ title: 'Erro', description: 'Não foi possível adicionar o subitem.', variant: 'destructive' }),
      },
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Subitens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Nome do subitem"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            className="bg-secondary border-border"
          />
          <Button type="button" onClick={handleAdd} disabled={upsertSubitem.isPending || !novoNome.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>

        <Separator />

        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Nome</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {subitens.map((s) => (
              <TableRow key={s.id} className="border-border">
                <TableCell>{s.nome}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteSubitem.mutate({ id: s.id, catalogo: catalogoId })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {subitens.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                  Nenhum subitem cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default CatalogFormPage;
