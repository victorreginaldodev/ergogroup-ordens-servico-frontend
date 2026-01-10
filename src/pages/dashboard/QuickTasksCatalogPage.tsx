import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { ListChecks, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useDeleteQuickTaskCatalog, useQuickTaskCatalog } from '@/services/quickTasks';
import { useUserRole } from '@/hooks/useUserRole';

const QuickTasksCatalogPage = () => {
  const { data: catalog = [], isLoading } = useQuickTaskCatalog();
  const deleteCatalogItem = useDeleteQuickTaskCatalog();
  const navigate = useNavigate();
  const location = useLocation();
  const { canManageQuickTasks } = useUserRole();
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((item) => {
      return (
        item.nome?.toLowerCase().includes(q) ||
        (item.descricao ?? '').toLowerCase().includes(q)
      );
    });
  }, [catalog, query]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) =>
      (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR', { sensitivity: 'base' }),
    );
  }, [filtered]);

  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginated = sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de Tarefas Rápidas</h1>
          <p className="text-muted-foreground">
            Mantenha os serviços rápidos disponíveis para seleção nas MiniOS.
          </p>
        </div>
        <Button
          variant="hero"
          disabled={!canManageQuickTasks}
          onClick={() => {
            if (!canManageQuickTasks) return;
            navigate('/dashboard/quick-tasks/catalog/new');
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo serviço rápido
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <Input
            placeholder="Buscar por nome ou descrição..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="bg-secondary border-border uppercase"
          />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="uppercase">Nome</TableHead>
                <TableHead className="uppercase">Descrição</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <TableRow key={`skeleton-${idx}`} className="border-border">
                      <TableCell>
                        <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-full rounded bg-muted animate-pulse" />
                      </TableCell>
                      <TableCell>
                        <div className="h-8 w-8 rounded bg-muted animate-pulse" />
                      </TableCell>
                    </TableRow>
                  ))
                : paginated.map((item) => (
                    <TableRow key={item.id} className="border-border">
                      <TableCell className="font-medium uppercase">{item.nome}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.descricao || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {canManageQuickTasks ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/dashboard/quick-tasks/catalog/${item.id}/edit`)
                                }
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      'Deseja excluir este serviço do catálogo de tarefas rápidas?',
                                    )
                                  ) {
                                    deleteCatalogItem.mutate(item.id);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              {!isLoading && sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <ListChecks className="h-12 w-12" />
                      <div>
                        <h3 className="text-lg font-semibold">Nenhum serviço cadastrado</h3>
                        <p className="text-sm">
                          Crie um serviço rápido para utilizá-lo nas MiniOS.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="px-4">
            <Separator />
          </div>

          {totalPages > 1 && (
            <div className="p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {(() => {
                    const siblingCount = 1;
                    const items: (number | 'ellipsis')[] = [];
                    if (totalPages <= 7) {
                      for (let p = 1; p <= totalPages; p++) items.push(p);
                    } else {
                      items.push(1);
                      const start = Math.max(2, page - siblingCount);
                      const end = Math.min(totalPages - 1, page + siblingCount);
                      if (start > 2) items.push('ellipsis');
                      for (let p = start; p <= end; p++) items.push(p);
                      if (end < totalPages - 1) items.push('ellipsis');
                      items.push(totalPages);
                    }
                    return items.map((entry, idx) =>
                      entry === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={`page-${entry}`}>
                          <PaginationLink
                            href="#"
                            isActive={entry === page}
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(Number(entry));
                            }}
                          >
                            {entry}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    );
                  })()}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages) setPage(page + 1);
                      }}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickTasksCatalogPage;

