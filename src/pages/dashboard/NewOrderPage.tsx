import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BackButton from '@/components/BackButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { ServiceItem } from '@/types';
import { Switch } from '@/components/ui/switch';
import { useClients } from '@/services/clients';
import { useServicesCatalog } from '@/services/catalog';
import { useUpsertServiceOrder, useServiceOrder } from '@/services/orders';
import AddServiceDialog from '@/components/order/AddServiceDialog';
import { useUserRole } from '@/hooks/useUserRole';



const NewOrderPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { isRestricted } = useUserRole();

  useEffect(() => {
    if (isRestricted) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate('/dashboard/orders');
    }
  }, [isRestricted, navigate, toast]);

  if (isRestricted) return null;

  const { data: fetchedClients = [] } = useClients();
  const { data: fetchedServices = [], isLoading: servicesLoading, isError: servicesError } = useServicesCatalog();
  const { data: orderData } = useServiceOrder(id);
  const upsert = useUpsertServiceOrder();

  const clientsData = useMemo(() => {
    if (!orderData?.cliente) return fetchedClients;
    const exists = fetchedClients.some(c => String(c.id) === String(orderData.cliente.id));
    if (!exists) {
      // @ts-ignore
      return [...fetchedClients, { id: orderData.cliente.id, name: orderData.cliente.nome }];
    }
    return fetchedClients;
  }, [fetchedClients, orderData]);

  const servicesData = useMemo(() => {
     let current = [...fetchedServices];
     if (orderData?.servicos) {
        orderData.servicos.forEach(s => {
           if (s.catalogo && !current.some(x => String(x.id) === String(s.catalogo.id))) {
               // @ts-ignore
               current.push({ id: s.catalogo.id, name: s.catalogo.nome, price: 0 });
           }
        });
     }
     return current;
  }, [fetchedServices, orderData]);


  const toNumberBR = (value: unknown): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return 0;
      const cleaned = trimmed.replace(/[^\d.,-]/g, '');
      const normalized = cleaned.replace(/\./g, '').replace(',', '.');
      const n = Number(normalized);
      return isFinite(n) ? n : 0;
    }
    return 0;
  };

  const [formData, setFormData] = useState({
    clientId: '',
    saleDate: '',
    paymentMethod: '',
    installments: 1,
    releaseBilling: false,
    invoiceContactName: '',
    invoiceContactEmail: '',
    billingNotes: '',
    type: 'avulso' as 'avulso' | 'contrato',
    contractStart: '',
    contractEnd: '',
    autoRenew: false,
    nonBillable: false,
  });

  const [orderServices, setOrderServices] = useState<ServiceItem[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceItem | undefined>(undefined);

  useEffect(() => {
    // Restringe o preenchimento apenas para o modo de edição (quando há ID)
    if (!id || !orderData) return;

    const sourceData = orderData;

    if (!sourceData || !sourceData.cliente) return;

    // Tentar encontrar o cliente pelo ID ou nome
    const client = clientsData.find(c => String(c.id) === String(sourceData.cliente?.id)) || 
                   clientsData.find(c => c.name === sourceData.cliente?.nome);
    const clientId = client ? String(client.id) : String(sourceData.cliente?.id || '');

    setFormData({
      clientId: clientId,
      saleDate: sourceData.data_venda || '',
      paymentMethod: (sourceData.forma_pagamento || '').toLowerCase(),
      installments: sourceData.qtde_parcelas ?? 1,
      releaseBilling: !!sourceData.liberar_faturamento,
      invoiceContactName: sourceData.nome_contato_envio_nf || '',
      invoiceContactEmail: sourceData.email_envio_nf || '',
      billingNotes: sourceData.observacao_faturamento || '',
      type: sourceData.tipo === 'contrato' ? 'contrato' : 'avulso',
      contractStart: sourceData.inicio_vigencia ?? '',
      contractEnd: sourceData.fim_vigencia ?? '',
      autoRenew: !!sourceData.renovacao_automatica,
      nonBillable: !!sourceData.nao_faturavel,
    });

    const items = (sourceData.servicos || []).map((s, idx) => {
      // Tentar encontrar o serviço pelo ID ou nome
      const svc = servicesData.find(x => String(x.id) === String(s.catalogo?.id)) || 
                  servicesData.find(x => x.name === s.catalogo?.nome);
      const serviceId = svc ? String(svc.id) : String(s.catalogo?.id || '');
      const serviceName = svc?.name ?? s.catalogo?.nome ?? '';
      
      return {
        id: `${Date.now()}-${idx}`,
        serviceId: serviceId,
        serviceName: serviceName,
        quantity: Number(s.quantidade ?? 1),
        unitPrice: Number(s.valor_servico ?? 0),
        total: Number(s.valor_servico ?? 0) * Number(s.quantidade ?? 1),
        status: 'pending',
        note: s.descricao || '',
      } as ServiceItem;
    });
    setOrderServices(items);
  }, [orderData, servicesData, clientsData, id]);


  const handleAddService = (item: ServiceItem) => {
    const exists = orderServices.some(s => String(s.serviceId) === String(item.serviceId));
    if (exists) {
      toast({
        title: "Serviço já adicionado",
        description: "Este serviço já está na lista.",
        variant: "destructive",
      });
      return;
    }
    const finalItem = { ...item, total: (Number.isFinite(item.unitPrice) ? item.unitPrice : 0) * (Number.isFinite(item.quantity) ? item.quantity : 1) };
    setOrderServices([...orderServices, finalItem]);
  };

  const handleUpdateService = (item: ServiceItem) => {
    const existsAnother = orderServices.some(s => s.id !== item.id && String(s.serviceId) === String(item.serviceId));
    if (existsAnother) {
      toast({
        title: "Serviço duplicado",
        description: "Já existe um serviço igual na lista.",
        variant: "destructive",
      });
      return;
    }
    setOrderServices(orderServices.map(s => s.id === item.id ? { ...item, total: (Number.isFinite(item.unitPrice) ? item.unitPrice : 0) * (Number.isFinite(item.quantity) ? item.quantity : 1) } : s));
  };

  const openEditModal = (item: ServiceItem) => {
    setEditingItem(item);
    setIsAddOpen(true);
  };

  const handleOpenChange = (v: boolean) => {
    setIsAddOpen(v);
    if (!v) setEditingItem(undefined);
  };

  const handleUpdateServicePrice = (id: string, price: number) => {
    if (price < 0 || isNaN(price)) return;
    setOrderServices(orderServices.map(s =>
      s.id === id
        ? { ...s, unitPrice: price, total: price * (Number.isFinite(s.quantity) ? s.quantity : 1) }
        : s
    ));
  };

  const handleUpdateServiceNote = (id: string, note: string) => {
    setOrderServices(orderServices.map(s =>
      s.id === id
        ? { ...s, note }
        : s
    ));
  };

  const handleUpdateServiceQuantity = (id: string, quantity: number) => {
    const q = Math.max(1, isNaN(quantity) ? 1 : quantity);
    setOrderServices(orderServices.map(s =>
      s.id === id
        ? { ...s, quantity: q, total: (Number.isFinite(s.unitPrice) ? s.unitPrice : 0) * q }
        : s
    ));
  };

  const handleRemoveService = (id: string) => {
    setOrderServices(orderServices.filter(s => s.id !== id));
  };

  const servicesTotal = orderServices.reduce((acc, s) => acc + (Number.isFinite(s.total) ? s.total : 0), 0);
  const totalAmount = servicesTotal > 0 ? servicesTotal : Number(orderData?.valor_total ?? 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!formData.clientId) missing.push("Cliente");
    if (!formData.saleDate) missing.push("Data da Venda");
    if (!formData.paymentMethod) missing.push("Forma de Pagamento");
    const inst = Number(formData.installments);
    if (!Number.isFinite(inst) || inst < 1) missing.push("Quantidade de parcelas");
    if (!formData.type) missing.push("Tipo");
    if (formData.type === 'contrato') {
      if (!formData.contractStart) missing.push("Início da vigência");
      if (!formData.contractEnd) missing.push("Fim da vigência");
    }
    if (!formData.invoiceContactName) missing.push("Nome do responsável pela NF");
    if (!formData.invoiceContactEmail) missing.push("Email de envio da NF");
    if (!formData.billingNotes) missing.push("Observações de faturamento");
    if (orderServices.length === 0) {
      missing.push("Serviços");
    } else {
      const anyWithoutNote = orderServices.some(s => !s.note || !s.note.trim());
      if (anyWithoutNote) missing.push("Descrição do serviço");
    }
    if (missing.length > 0) {
      toast({
        title: "Campos obrigatórios ausentes",
        description: `Preencha: ${missing.join(", ")}.`,
        variant: "destructive",
      });
      return;
    }

    const payload = {
      id,
      cliente: Number(formData.clientId),
      data_venda: formData.saleDate,
      tipo_ordem_servico: formData.type,
      status: orderData?.status ?? 'nao_iniciado',
      valor_total: totalAmount,
      servicos: orderServices.map(s => ({
        catalogo_servico: Number(s.serviceId),
        quantidade: Number.isFinite(s.quantity) ? s.quantity : 1,
        valor: Number(s.unitPrice ?? 0),
        descricao: s.note || undefined,
      })),
      faturamento: {
        nome_contato_envio_nf: formData.invoiceContactName || undefined,
        contato_envio_nf: formData.invoiceContactEmail || undefined,
        forma_pagamento: formData.paymentMethod || undefined,
        descricao_faturamento: formData.billingNotes || undefined,
        nao_faturavel: !!formData.nonBillable,
        faturamento_liberado: !!formData.releaseBilling,
      },
    };

    upsert.mutate(payload, {
      onSuccess: () => {
        toast({
          title: id ? "Ordem atualizada com sucesso!" : "Ordem criada com sucesso!",
          description: "A ordem de serviço foi processada no backend.",
        });
        navigate('/dashboard/orders');
      },
      onError: () => {
        toast({
          title: "Erro ao salvar",
          description: "Verifique os dados e tente novamente.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{id ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}</h1>
          <p className="text-muted-foreground">{id ? 'Atualize os dados da ordem' : 'Preencha os dados para criar uma nova ordem'}</p>
        </div>
        <BackButton />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Dados da Venda e Faturamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Cliente *</Label>
                <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v, invoiceContact: '' })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsData.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clientsData.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    Nenhum cliente encontrado.{' '}
                    <Link to="/dashboard/clients/new" className="underline">
                      Cadastrar cliente
                    </Link>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleDate">Data da Venda *</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">Pix</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debto">Débto</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="installments">Quantidade de parcelas *</Label>
                <Input
                  id="installments"
                  type="number"
                  min={1}
                  value={formData.installments}
                  onChange={(e) => setFormData({ ...formData, installments: Number(e.target.value) })}
                  className="bg-secondary border-border"
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as 'avulso' | 'contrato' })}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avulso">Avulso</SelectItem>
                    <SelectItem value="contrato">Contrato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.type === 'contrato' && (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractStart">Início da vigência *</Label>
                  <Input
                    id="contractStart"
                    type="date"
                    value={formData.contractStart}
                    onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contractEnd">Fim da vigência *</Label>
                  <Input
                    id="contractEnd"
                    type="date"
                    value={formData.contractEnd}
                    onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Renovação automática</Label>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.autoRenew}
                      onCheckedChange={(v) => setFormData({ ...formData, autoRenew: v })}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="invoiceContactName">Nome do responsável pela NF *</Label>
                <Input
                  id="invoiceContactName"
                  value={formData.invoiceContactName}
                  onChange={(e) => setFormData({ ...formData, invoiceContactName: e.target.value })}
                  className="bg-secondary border-border"
                  placeholder="Nome do responsável"
                />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="invoiceContactEmail">Email de envio da NF *</Label>
                <Input
                  id="invoiceContactEmail"
                  type="email"
                  value={formData.invoiceContactEmail}
                  onChange={(e) => setFormData({ ...formData, invoiceContactEmail: e.target.value })}
                  className="bg-secondary border-border"
                  placeholder="email@empresa.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingNotes">Observações de faturamento *</Label>
              <Textarea
                id="billingNotes"
                value={formData.billingNotes}
                onChange={(e) => setFormData({ ...formData, billingNotes: e.target.value })}
                className="bg-secondary border-border min-h-24"
                placeholder="Observações adicionais sobre faturamento..."
              />
            </div>
            <div className="space-y-2">
              <Label>Ordem de Serviço não faturável</Label>
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.nonBillable}
                  onCheckedChange={(v) => setFormData({ ...formData, nonBillable: v })}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Liberar faturamento</Label>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.releaseBilling}
                    onCheckedChange={(v) => setFormData({ ...formData, releaseBilling: v })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Serviços</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {servicesData.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Nenhum serviço no catálogo.{' '}
                <Link to="/dashboard/catalog/new" className="underline">
                  Cadastrar serviço
                </Link>
              </div>
            )}

            {orderServices.length > 0 ? (
              <div className="space-y-3">
                {orderServices.map(service => (
                  <div
                    key={service.id}
                    className="p-4 rounded-md border border-border bg-card hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{service.serviceName}</p>
                        {service.note && <p className="text-sm text-muted-foreground truncate">{service.note}</p>}
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Valor</span>
                          <div className="font-medium">{formatCurrency(service.unitPrice)}</div>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Qtd</span>
                          <div className="font-medium">{service.quantity}</div>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Total</span>
                          <div className="font-semibold">{formatCurrency(service.total)}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => openEditModal(service)}
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive"
                          onClick={() => handleRemoveService(service.id)}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum serviço adicionado ainda
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAddOpen(true)}
                disabled={servicesLoading || servicesError || servicesData.length === 0}
              >
                <Plus className="w-4 h-4" />
                Adicionar Serviço
              </Button>
            </div>
            <AddServiceDialog
              open={isAddOpen}
              onOpenChange={handleOpenChange}
              services={servicesData}
              existingIds={orderServices.map(s => String(s.serviceId))}
              onAdd={handleAddService}
              itemToEdit={editingItem}
              onUpdate={handleUpdateService}
            />
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            

            <div className="space-y-2">
              {orderServices.map(service => (
                <div key={service.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {service.serviceName}
                  </span>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(service.total)}</div>
                    <div className="text-xs text-muted-foreground">
                      Qtd: {service.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {orderServices.length > 0 && (
              <>
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="gradient-text">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </>
            )}

            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={upsert.isPending}>
              <Save className="w-4 h-4" />
              {id ? 'Salvar Alterações' : 'Criar Ordem'}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default NewOrderPage;
