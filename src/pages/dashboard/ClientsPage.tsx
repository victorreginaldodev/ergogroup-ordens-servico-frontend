import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Users } from 'lucide-react';
import { Client } from '@/types';
import { useClients, useDeleteClient } from '@/services/clients';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const ClientsPage = () => {
  const { data: clients = [] } = useClients();
  const del = useDeleteClient();
  const navigate = useNavigate();
  const location = useLocation();

  const formatDoc = (digits?: string) => {
    const d = (digits || '').replace(/\D/g, '');
    if (d.length === 11) {
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
    }
    if (d.length === 14) {
      return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
    }
    return digits || '';
  };

  const [query, setQuery] = useState<string>(new URLSearchParams(location.search).get('q') || '');
  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams(location.search);
      if (query) params.set('q', query);
      else params.delete('q');
      navigate({ search: params.toString() }, { replace: true });
    }, 250);
    return () => clearTimeout(id);
  }, [query]);
  const q = query.toLowerCase();
  const filtered = q
    ? clients.filter(c =>
        [c.name, c.email, c.phone, c.document].filter(Boolean).some(v => v!.toLowerCase().includes(q))
      )
    : clients;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">Gerencie seus clientes</p>
          <Button asChild variant="hero">
            <Link to="/dashboard/clients/new">Novo cliente</Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Cliente</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="border-border">
                  <TableCell>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      {c.document && (
                        <p className="text-xs text-muted-foreground">
                          {c.tipo_inscricao?.toUpperCase()}: {formatDoc(c.document)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone || '-'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/clients/${c.id}/edit`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => del.mutate(c.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione um novo cliente para começar
              </p>
              <Button asChild variant="hero">
                <Link to="/dashboard/clients/new">Novo cliente</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsPage;
