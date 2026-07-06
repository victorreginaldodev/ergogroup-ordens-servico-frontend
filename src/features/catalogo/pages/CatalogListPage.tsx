import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Edit, MoreVertical, Plus, Trash2, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDeleteRepository, useRepositoriesPage } from '../hooks';
import { useUserRole } from '@/hooks/useUserRole';

const CatalogListPage = () => {
  const del = useDeleteRepository();
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useUserRole();
  const isTechnician = role === 'tecnico';
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState<string>(new URLSearchParams(location.search).get('q') || '');

  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams(location.search);
      if (query) params.set('q', query);
      else params.delete('q');
      navigate({ search: params.toString() }, { replace: true });
    }, 250);
    return () => clearTimeout(id);
  }, [query, location.search, navigate]);

  const { data, isLoading } = useRepositoriesPage({
    page,
    pageSize: 10,
    q: query || undefined,
  });
  const repos = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  useEffect(() => {
    setPage(1);
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">Gerencie seu catálogo</p>
          <Button onClick={() => navigate('/dashboard/catalog/new')} variant="hero" disabled={isTechnician}>
            <Plus className="w-4 h-4 mr-2" />
            Novo serviço
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input placeholder="Buscar por nome..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repos.map((r) => (
                <TableRow key={r.id} className="border-border">
                  <TableCell><p className="font-medium uppercase">{r.name}</p></TableCell>
                  <TableCell>
                    {isTechnician ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/catalog/${r.id}/edit`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => del.mutate(r.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4"><Separator /></div>
          {totalPages > 1 && (
            <div className="p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }} className={page === 1 ? 'pointer-events-none opacity-50' : ''} />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2)).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink href="#" isActive={p === page} onClick={(e) => { e.preventDefault(); setPage(p); }}>{p}</PaginationLink>
                    </PaginationItem>
                  ))}
                  {totalPages > 5 && page < totalPages - 2 && <PaginationItem><PaginationEllipsis /></PaginationItem>}
                  <PaginationItem>
                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
          {!isLoading && repos.length === 0 && (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum item no catálogo</h3>
              <p className="text-muted-foreground mb-4">Adicione um novo repositório para começar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CatalogListPage;
