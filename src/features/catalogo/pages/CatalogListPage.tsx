import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Edit, MoreVertical, Package, Plus, Search, Trash2 } from 'lucide-react';

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
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCatalogos, useDeleteCatalogo } from '../hooks';
import { COMPLEXIDADE_DOT, COMPLEXIDADE_LABEL } from '../services';
import { useUserRole } from '@/hooks/useUserRole';

const PAGE_SIZE = 10;

const dotBadge = (dotColorClass: string, label: string) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground">
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorClass}`} />
    {label}
  </span>
);

const CatalogListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canManageCatalogoComum } = useUserRole();
  const isBlocked = !canManageCatalogoComum;
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

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold">Catálogo</h1>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {isLoading ? 'carregando…' : `${allItems.length} ${allItems.length === 1 ? 'serviço' : 'serviços'}`}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">Gerencie os serviços utilizados nas Ordens de Serviço</p>
        </div>
        <Button onClick={() => navigate('/catalogo/new')} variant="hero" disabled={isBlocked}>
          <Plus className="w-4 h-4" />
          Novo serviço
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por nome ou descrição..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-card border-border h-11 rounded-[11px] text-sm"
        />
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[300px]">Nome</TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[320px]">Descrição</TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[110px]">Complexidade</TableHead>
                  <TableHead className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground py-2 px-3 w-[110px]">Horas estimadas</TableHead>
                  <TableHead className="py-2 px-3 w-[40px]" />
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading
                  ? Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                      <TableRow key={`skeleton-${idx}`} className="border-border">
                        <TableCell className="py-3 px-3"><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell className="py-3 px-3"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="py-3 px-3"><Skeleton className="h-3 w-20" /></TableCell>
                        <TableCell className="py-3 px-3"><Skeleton className="h-3 w-16" /></TableCell>
                        <TableCell className="py-3 px-3" />
                      </TableRow>
                    ))
                  : items.map((c) => (
                      <TableRow
                        key={c.id}
                        className={`border-border hover:bg-muted/40 transition-colors group ${isBlocked ? '' : 'cursor-pointer'}`}
                        onClick={isBlocked ? undefined : () => navigate(`/catalogo/${c.id}/edit`)}
                      >
                        <TableCell className="py-3 px-3">
                          <span className="text-sm font-semibold uppercase">{c.nome}</span>
                        </TableCell>

                        <TableCell className="py-3 px-3 max-w-[320px]">
                          <span className="text-sm text-muted-foreground truncate block" title={c.descricao ?? undefined}>{c.descricao || '—'}</span>
                        </TableCell>

                        <TableCell className="py-3 px-3">
                          {c.complexidade
                            ? dotBadge(COMPLEXIDADE_DOT[c.complexidade], COMPLEXIDADE_LABEL[c.complexidade])
                            : <span className="text-[11px] text-muted-foreground">—</span>
                          }
                        </TableCell>

                        <TableCell className="py-3 px-3">
                          <span className="text-sm tabular-nums">{c.horasEstimadas ?? '—'}</span>
                        </TableCell>

                        <TableCell className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          {isBlocked ? (
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
                                <DropdownMenuItem onClick={() => navigate(`/catalogo/${c.id}/edit`)}>
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
                    ))
                }
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}
                      className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {(() => {
                    const pageItems: (number | 'ellipsis')[] = [];
                    if (totalPages <= 7) {
                      for (let p = 1; p <= totalPages; p++) pageItems.push(p);
                    } else {
                      pageItems.push(1);
                      const left = Math.max(page - 1, 2);
                      const right = Math.min(page + 1, totalPages - 1);
                      if (left > 2) pageItems.push('ellipsis');
                      for (let p = left; p <= right; p++) pageItems.push(p);
                      if (right < totalPages - 1) pageItems.push('ellipsis');
                      pageItems.push(totalPages);
                    }
                    return pageItems.map((it, idx) => (
                      <PaginationItem key={`${it}-${idx}`}>
                        {it === 'ellipsis'
                          ? <PaginationEllipsis />
                          : <PaginationLink href="#" isActive={it === page} onClick={(e) => { e.preventDefault(); setPage(it as number); }}>{it}</PaginationLink>
                        }
                      </PaginationItem>
                    ));
                  })()}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum item no catálogo</h3>
              <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                {query ? 'Ajuste a busca acima para encontrar um serviço.' : 'Adicione um novo serviço para começar.'}
              </p>
              {query && (
                <Button variant="outline" onClick={() => setQuery('')}>
                  Limpar busca
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CatalogListPage;
