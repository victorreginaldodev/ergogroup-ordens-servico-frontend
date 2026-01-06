import { useMemo, useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  Search,
  FileText,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ServiceOrder } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useServiceOrders, OrdemServicoDTO } from '@/services/orders';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

type OrdemFaturamentoUpdate = {
  faturar_em?: string;
  nao_faturavel?: boolean;
  faturamento_liberado?: boolean;
  contato_envio_nf?: number;
  descricao_faturamento?: string;
  forma_pagamento?: string;
  numero_nf?: string;
  data_faturamento?: string;
};

const FinancialPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const { data: orders = [] } = useServiceOrders();
  const queryClient = useQueryClient();

  const updateBilling = useMutation({
    mutationFn: async ({ id, data }: { id: string | number, data: OrdemFaturamentoUpdate }) => {
      const { data: res } = await api.patch<OrdemServicoDTO>(`/api/ordens-servico/${id}/`, { faturamento: data });
      return res;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
    },
  });
  
  const [billingOpen, setBillingOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [nfNumber, setNfNumber] = useState('');
  const [billingDate, setBillingDate] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [notes, setNotes] = useState('');
  const [emitOpen, setEmitOpen] = useState(false);

  const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
  const today = new Date();
  const pendingDueRevenue = orders
    .filter(o => !o.isPaid && o.dueDate <= today)
    .reduce((acc, order) => acc + order.totalAmount, 0);
  const futureRevenue = orders
    .filter(o => !o.isPaid && o.dueDate > today)
    .reduce((acc, order) => acc + order.totalAmount, 0);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPayment = 
      paymentFilter === 'all' || 
      (paymentFilter === 'paid' && order.isPaid) ||
      (paymentFilter === 'pending' && !order.isPaid);
    return matchesSearch && matchesPayment;
  });

  const stats = [
    {
      title: 'Total de Faturamento',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Faturamentos Pendentes',
      value: formatCurrency(pendingDueRevenue),
      icon: AlertCircle,
      color: 'text-status-pending',
      bgColor: 'bg-status-pending/10',
    },
    {
      title: 'Faturamentos Futuros',
      value: formatCurrency(futureRevenue),
      icon: Clock,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
  ];

  const pieData = useMemo(() => {
    const paid = orders.filter(o => o.isPaid).length;
    const pending = orders.filter(o => !o.isPaid).length;
    return [
      { name: 'Pagos', value: paid, color: 'hsl(142, 76%, 36%)' },
      { name: 'Pendentes', value: pending, color: 'hsl(45, 93%, 47%)' },
    ];
  }, [orders]);

  const monthlyBillingData = useMemo(() => {
    const map = new Map<string, number>();
    orders
      .filter(o => o.isPaid)
      .forEach(o => {
        const d = o.updatedAt instanceof Date ? o.updatedAt : new Date(o.updatedAt);
        const key = `${monthLabels[d.getMonth()]}/${d.getFullYear()}`;
        map.set(key, (map.get(key) || 0) + o.totalAmount);
      });
    return Array.from(map.entries())
      .sort((a, b) => {
        const [am, ay] = a[0].split('/');
        const [bm, by] = b[0].split('/');
        const mi = monthLabels.indexOf(am);
        const mj = monthLabels.indexOf(bm);
        const yi = Number(ay);
        const yj = Number(by);
        if (yi === yj) return mi - mj;
        return yi - yj;
      })
      .map(([name, billing]) => ({ name, billing }));
  }, [orders]);

  const openBilling = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setNfNumber('');
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setBillingDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    setNotes('');
    setBillingOpen(true);
  };

  const confirmBilling = async () => {
    if (!selectedOrder) return;
    if (!nfNumber.trim()) return;
    
    try {
      await updateBilling.mutateAsync({
        id: selectedOrder.id,
        data: {
          numero_nf: nfNumber,
          data_faturamento: billingDate,
          descricao_faturamento: notes,
          faturar_em: billingDate,
          faturamento_liberado: true,
        }
      });
      setBillingOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Failed to bill order", error);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Acompanhe suas receitas e faturamento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Faturamento Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBillingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(222, 47%, 10%)', 
                      border: '1px solid hsl(222, 30%, 18%)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="billing" fill="hsl(173, 80%, 40%)" radius={[4, 4, 0, 0]} name="Faturamento" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Status de Pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(222, 47%, 10%)', 
                      border: '1px solid hsl(222, 30%, 18%)',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ordens para Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou ordem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-secondary border-border">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Ordem</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="border-border">
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.clientName}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(order.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge className={order.isPaid ? 'bg-status-completed text-primary-foreground' : 'bg-status-pending text-primary-foreground'}>
                      {order.isPaid ? 'Pago' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {formatDate(order.dueDate)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Ações">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => openBilling(order)}
                          className="gap-2"
                          disabled={order.isPaid}
                        >
                          <CreditCard className="w-4 h-4" />
                          Faturar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEmitOpen(true)} className="gap-2">
                          <FileText className="w-4 h-4" />
                          Emitir NF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={emitOpen} onOpenChange={setEmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emitir NF</DialogTitle>
            <DialogDescription>Funcionalidade em desenvolvimento</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setEmitOpen(false)}>Ok</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={billingOpen} onOpenChange={setBillingOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Faturar Ordem</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="bg-secondary/50 p-4 rounded-lg mb-4 grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Cliente</Label>
                <p className="font-medium">{selectedOrder.clientName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Valor Total</Label>
                <p className="font-medium text-lg">{formatCurrency(selectedOrder.totalAmount)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Serviços</Label>
                <p className="font-medium">{selectedOrder.services.length} itens</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Ordem</Label>
                <p className="font-medium">{selectedOrder.orderNumber}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Número da Nota Fiscal</Label>
              <Input value={nfNumber} onChange={(e) => setNfNumber(e.target.value)} placeholder="Ex.: 12345" />
            </div>
            <div className="grid gap-2">
              <Label>Data do Faturamento</Label>
              <Input type="date" value={billingDate} onChange={(e) => setBillingDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Observações (opcional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBillingOpen(false)}>Cancelar</Button>
            <Button onClick={confirmBilling} disabled={!nfNumber.trim() || updateBilling.isPending}>
              {updateBilling.isPending ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialPage;
