import { 
  ClipboardList, 
  Clock, 
  CheckCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { serviceOrders, services, formatCurrency, getStatusLabel, getStatusColor } from '@/data/mockData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UnderDevelopmentOverlay from '@/components/UnderDevelopmentOverlay';
import { SHOW_DASHBOARD_UNDER_DEVELOPMENT } from '@/config/features';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const stats = [
  {
    title: 'Total',
    value: serviceOrders.length.toString(),
    change: '+12%',
    changeType: 'positive' as const,
    icon: ClipboardList,
  },
  {
    title: 'Em espera',
    value: serviceOrders.filter(o => o.status === 'pending').length.toString(),
    change: '-3%',
    changeType: 'negative' as const,
    icon: Clock,
  },
  {
    title: 'Em andamento',
    value: serviceOrders.filter(o => o.status === 'in_progress').length.toString(),
    change: '+5%',
    changeType: 'positive' as const,
    icon: TrendingUp,
  },
  {
    title: 'Finalizado',
    value: serviceOrders.filter(o => o.status === 'completed').length.toString(),
    change: '+25%',
    changeType: 'positive' as const,
    icon: CheckCircle,
  },
];

const DashboardPage = () => {
  const recentOrders = serviceOrders.slice(0, 5);
  const [completedPeriodMonths, setCompletedPeriodMonths] = useState<string>('6');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('all');

  const now = new Date();
  const startDateForPeriod = useMemo(() => {
    const d = new Date(now);
    const months = parseInt(completedPeriodMonths);
    if (!isNaN(months)) d.setMonth(d.getMonth() - (months - 1));
    return d;
  }, [completedPeriodMonths]);

  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    serviceOrders.forEach((order) => {
      order.services.forEach((item) => {
        counts[item.serviceName] = (counts[item.serviceName] || 0) + item.quantity;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, []);

  const COLORS = ['hsl(173, 80%, 40%)', 'hsl(215, 85%, 60%)', 'hsl(280, 70%, 60%)', 'hsl(45, 85%, 55%)', 'hsl(0, 75%, 60%)', 'hsl(200, 70%, 55%)'];
  const totalPie = useMemo(() => pieData.reduce((acc, cur) => acc + cur.value, 0), [pieData]);
  const completedMonthlyData = useMemo(() => {
    const counts = Array(12).fill(0);
    serviceOrders.forEach((order) => {
      const monthIdx = (order.updatedAt || order.createdAt).getMonth();
      order.services.forEach((s) => {
        if (s.status === 'completed') {
          counts[monthIdx] += s.quantity;
        }
      });
    });
    return MONTHS.map((name, idx) => ({ name, value: counts[idx] }));
  }, []);
  const monthNow = new Date().getMonth();
  const prevMonth = (monthNow + 11) % 12;
  const currentVal = completedMonthlyData[monthNow]?.value || 0;
  const prevVal = completedMonthlyData[prevMonth]?.value || 0;
  const changePct = prevVal > 0 ? Math.round(((currentVal - prevVal) / prevVal) * 100) : (currentVal > 0 ? 100 : 0);
  const changePositive = changePct >= 0;

  const completedBarData = useMemo(() => {
    const monthsMap = new Map<string, number>();
    const start = startDateForPeriod;
    const iter = new Date(start);
    while (iter <= now) {
      const key = `${MONTHS[iter.getMonth()]}/${iter.getFullYear()}`;
      monthsMap.set(key, 0);
      iter.setMonth(iter.getMonth() + 1);
    }
    serviceOrders.forEach((order) => {
      const orderDate = order.updatedAt || order.createdAt;
      if (orderDate < start || orderDate > now) return;
      const key = `${MONTHS[orderDate.getMonth()]}/${orderDate.getFullYear()}`;
      order.services.forEach((s) => {
        if (s.status === 'completed') {
          monthsMap.set(key, (monthsMap.get(key) || 0) + s.quantity);
        }
      });
    });
    return Array.from(monthsMap.entries()).map(([name, value]) => ({ name, value }));
  }, [startDateForPeriod]);

  const statusPieData = useMemo(() => {
    const counts: Record<string, number> = { Pendente: 0, 'Em Andamento': 0, Concluído: 0, Cancelado: 0 };
    serviceOrders.forEach((order) => {
      order.services.forEach((s) => {
        const label = getStatusLabel(s.status);
        counts[label] = (counts[label] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);
  const STATUS_COLORS = ['hsl(45, 93%, 47%)', 'hsl(173, 80%, 40%)', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)'];

  const userProfiles = useMemo(() => {
    const set = new Set<string>();
    serviceOrders.forEach((o) => set.add(o.clientName));
    return Array.from(set).sort();
  }, []);

  const profileMonthlyData = useMemo(() => {
    const counts = Array(12).fill(0);
    serviceOrders.forEach((order) => {
      const monthIdx = (order.updatedAt || order.createdAt).getMonth();
      order.services.forEach((s) => {
        if (selectedProfileId === 'all' || order.clientName === selectedProfileId) {
          counts[monthIdx] += s.quantity;
        }
      });
    });
    return MONTHS.map((name, idx) => ({ name, value: counts[idx] }));
  }, [selectedProfileId]);

  const topClientsData = useMemo(() => {
    const counts: Record<string, number> = {};
    serviceOrders.forEach((order) => {
      const key = order.clientName;
      const sumQty = order.services.reduce((acc, s) => acc + s.quantity, 0);
      counts[key] = (counts[key] || 0) + sumQty;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, []);
  const totalClients = useMemo(() => topClientsData.reduce((acc, cur) => acc + cur.value, 0), [topClientsData]);

  return (
    <>
      {SHOW_DASHBOARD_UNDER_DEVELOPMENT && <UnderDevelopmentOverlay />}
      <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="bg-card border-border hover:border-primary/30 transition-colors" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${
                    stat.changeType === 'positive' ? 'text-status-completed' : 'text-destructive'
                  }`}>
                    {stat.changeType === 'positive' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {stat.change} vs mês anterior
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold">Serviços Concluídos por Período</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-2 text-sm ${changePositive ? 'text-status-completed' : 'text-destructive'}`}>
              <TrendingUp className="w-4 h-4" />
              {changePositive ? `+${changePct}%` : `${changePct}%`} este mês
            </div>
            <Select value={completedPeriodMonths} onValueChange={setCompletedPeriodMonths}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completedBarData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(222, 47%, 10%)', 
                    border: '1px solid hsl(222, 30%, 18%)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [value, 'Serviços Concluídos']}
                />
                <Bar dataKey="value" fill="hsl(173, 80%, 40%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Principais Serviços Executados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
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
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">% do total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pieData.map((item, index) => {
                    const pct = totalPie > 0 ? (item.value / totalPie) * 100 : 0;
                    const color = COLORS[index % COLORS.length];
                    return (
                      <TableRow key={item.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
                            {item.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.value}</TableCell>
                        <TableCell className="text-right">{pct.toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Serviços por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} paddingAngle={2}>
                      {statusPieData.map((entry, index) => (
                        <Cell key={`status-${entry.name}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 10%)',
                        border: '1px solid hsl(222, 30%, 18%)',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Execuções</CardTitle>
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Selecionar perfil de usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os perfis</SelectItem>
                  {userProfiles.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profileMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                    <XAxis dataKey="name" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 10%)',
                        border: '1px solid hsl(222, 30%, 18%)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value, 'Execuções']}
                    />
                    <Bar dataKey="value" fill="hsl(215, 85%, 60%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Principais Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topClientsData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2}>
                      {topClientsData.map((entry, index) => (
                        <Cell key={`client-${entry.name}`} fill={COLORS[index % COLORS.length]} />
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
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">% do total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topClientsData.map((item, index) => {
                      const pct = totalClients > 0 ? (item.value / totalClients) * 100 : 0;
                      const color = COLORS[index % COLORS.length];
                      return (
                        <TableRow key={item.name}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
                              {item.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.value}</TableCell>
                          <TableCell className="text-right">{pct.toFixed(1)}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ordens Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div 
                key={order.id} 
                className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{order.clientName}</p>
                  <p className="text-sm text-muted-foreground">{order.orderNumber}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default DashboardPage;
