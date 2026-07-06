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
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useClients, useContacts, useDeleteContact } from '../hooks';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const ContactListPage = () => {
  const { data: contacts = [] } = useContacts();
  const { data: clients = [] } = useClients();
  const del = useDeleteContact();
  const navigate = useNavigate();
  const location = useLocation();

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach(c => map.set(c.id, c.name));
    return map;
  }, [clients]);

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
    ? contacts.filter(c =>
        [c.nome, c.email, c.telefone, c.setor, c.funcao].filter(Boolean).some(v => v!.toLowerCase().includes(q))
      )
    : contacts;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contatos</h1>
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">Gerencie contatos de clientes</p>
          <Button asChild variant="hero">
            <Link to="/dashboard/contacts/new">Novo contato</Link>
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
                <TableHead>Contato</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="border-border">
                  <TableCell>
                    <div>
                      <p className="font-medium">{c.nome}</p>
                      <p className="text-xs text-muted-foreground">{c.setor} {c.funcao ? `• ${c.funcao}` : ''}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="text-muted-foreground">{c.telefone || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{clientNameById.get(c.cliente) || '-'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/contacts/${c.id}/edit`)}>
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
              <h3 className="text-lg font-semibold mb-2">Nenhum contato encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione um novo contato para começar
              </p>
              <Button asChild variant="hero">
                <Link to="/dashboard/contacts/new">Novo contato</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactListPage;
