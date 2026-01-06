import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useNavigate, useParams } from 'react-router-dom';
import { useClient, useUpsertClient } from '@/services/clients';

const schema = z.object({
  id: z.string().optional(),
  nome: z.string().min(2, 'Nome muito curto'),
  tipo_inscricao: z.enum(['cnpj', 'cpf', 'cei', 'cno', 'caepf', 'outro'], { required_error: 'Selecione o tipo' }),
  numero_inscricao: z.string().min(3, 'Número de inscrição inválido'),
  telefone_institucional: z.string().min(10, 'Telefone inválido'),
  email_institucional: z.string().email('E-mail institucional inválido'),
  endereco: z.object({
    rua: z.string().min(2, 'Rua inválida'),
    numero: z.string().min(1, 'Número inválido'),
    bairro: z.string().min(2, 'Bairro inválido'),
    cidade: z.string().min(2, 'Cidade inválida'),
    uf: z.string().length(2, 'UF inválida'),
    cep: z.string().min(8, 'CEP inválido'),
  }),
});

type FormValues = z.infer<typeof schema>;

const ClientFormPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;
  const { data: existing } = useClient(id);
  const upsert = useUpsertClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: undefined,
      nome: '',
      tipo_inscricao: 'cpf',
      numero_inscricao: '',
      telefone_institucional: '',
      email_institucional: '',
      endereco: { rua: '', numero: '', bairro: '', cidade: '', uf: '', cep: '' },
    },
  });

  useEffect(() => {
    if (existing) {
      const parseAddress = (address?: string) => {
        const text = address || '';
        const cepMatch = text.match(/\b\d{5}-?\d{3}\b/);
        const cityUfMatch = text.match(/([A-Za-zÀ-ÿ\s]+)\/([A-Za-z]{2})/);
        const ruaPart = text.split(',')[0]?.trim() || '';
        const numeroMatch = text.match(/,\s*(\d+)/);
        const bairroMatch = text.match(/-\s*([^,]+)/);
        return {
          rua: ruaPart || '',
          numero: numeroMatch?.[1] || '',
          bairro: bairroMatch?.[1]?.trim() || '',
          cidade: cityUfMatch?.[1]?.trim() || '',
          uf: cityUfMatch?.[2] || '',
          cep: cepMatch?.[0] || '',
        };
      };
      form.reset({
        id: existing.id,
        nome: existing.name,
        tipo_inscricao: (existing.tipo_inscricao as FormValues['tipo_inscricao']) || 'cpf',
        numero_inscricao: existing.document || '',
        telefone_institucional: existing.phone || '',
        email_institucional: existing.email || '',
        endereco: parseAddress(existing.address),
      });
    }
  }, [existing]);

  const onSubmit = (values: FormValues) => {
    const payload = { ...values, id: values.id };
    upsert.mutate(payload, {
      onSuccess: () => {
        navigate('/dashboard/clients');
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{id ? 'Editar Cliente' : 'Adicionar Cliente'}</h1>
        <BackButton to="/dashboard/clients" />
      </div>
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <Form {...form}>
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do cliente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email_institucional"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>E-mail institucional</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@dominio.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefone_institucional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone institucional</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo_inscricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de inscrição</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cei">CEI</SelectItem>
                        <SelectItem value="cno">CNO</SelectItem>
                        <SelectItem value="caepf">CAEPF</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numero_inscricao"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Número de inscrição</FormLabel>
                    <FormControl>
                      <Input placeholder="CPF/CNPJ/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endereco.rua"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rua</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endereco.numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input placeholder="Número" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endereco.bairro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endereco.cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endereco.uf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a UF" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AC">Acre</SelectItem>
                        <SelectItem value="AL">Alagoas</SelectItem>
                        <SelectItem value="AP">Amapá</SelectItem>
                        <SelectItem value="AM">Amazonas</SelectItem>
                        <SelectItem value="BA">Bahia</SelectItem>
                        <SelectItem value="CE">Ceará</SelectItem>
                        <SelectItem value="DF">Distrito Federal</SelectItem>
                        <SelectItem value="ES">Espírito Santo</SelectItem>
                        <SelectItem value="GO">Goiás</SelectItem>
                        <SelectItem value="MA">Maranhão</SelectItem>
                        <SelectItem value="MT">Mato Grosso</SelectItem>
                        <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                        <SelectItem value="MG">Minas Gerais</SelectItem>
                        <SelectItem value="PA">Pará</SelectItem>
                        <SelectItem value="PB">Paraíba</SelectItem>
                        <SelectItem value="PR">Paraná</SelectItem>
                        <SelectItem value="PE">Pernambuco</SelectItem>
                        <SelectItem value="PI">Piauí</SelectItem>
                        <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                        <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                        <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                        <SelectItem value="RO">Rondônia</SelectItem>
                        <SelectItem value="RR">Roraima</SelectItem>
                        <SelectItem value="SC">Santa Catarina</SelectItem>
                        <SelectItem value="SP">São Paulo</SelectItem>
                        <SelectItem value="SE">Sergipe</SelectItem>
                        <SelectItem value="TO">Tocantins</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endereco.cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard/clients')}>
                  Cancelar
                </Button>
                <Button type="submit" className="min-w-32">{id ? 'Salvar' : 'Adicionar'}</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientFormPage;
