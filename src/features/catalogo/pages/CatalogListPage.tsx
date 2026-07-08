import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Edit, MoreVertical, Plus, Trash2, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useCatalogos, useDeleteCatalogo } from '../hooks';
import { COMPLEXIDADE_LABEL } from '../services';
import { useUserRole } from '@/hooks/useUserRole';

const PAGE_SIZE = 10;

const CatalogListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useUserRole();
  const isTechnician = role === 'tecnico';
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState<string>(new URLSearchParams(location.search).get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedQuery(query);
      const params = new URLSearchParams(location.search);
      if (query) params.set('q', query);
      else params.delete('q');
      navigate({ search: params.toString() }, { replace: true });
    }, 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const del = useDeleteCatalogo();
  const { data: allItems = [], isLoading } = useCatalogos({ q: debouncedQuery || undefined });

  const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  const items = useMemo(
    () => allItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [allItems, page],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">Gerencie os serviços utilizados nas Ordens de Serviço</p>
          <Button onClick={() => navigate('/dashboard/catalog/new')} variant="hero" disabled={isTechnician}>
            <Plus className="w-4 h-4 mr-2" />
            Novo serviço
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input placeholder="Buscar por nome ou descrição..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>Complexidade</TableHead>
                <TableHead>Horas estimadas</TableHead>
                <TableHead>Subitens</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id} className="border-border">
                  <TableCell><p className="font-medium uppercase">{c.nome}</p></TableCell>
                  <TableCell>
                    {c.complexidade ? (
                      <Badge variant="outline">{COMPLEXIDADE_LABEL[c.complexidade]}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{c.horasEstimadas ?? '-'}</TableCell>
                  <TableCell>{c.subitens.length}</TableCell>
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
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/catalog/${c.id}/edit`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => del.mutate(c.id)}>
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
          {!isLoading && items.length === 0 && (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum item no catálogo</h3>
              <p className="text-muted-foreground mb-4">Adicione um novo serviço para começar</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CatalogListPage;
