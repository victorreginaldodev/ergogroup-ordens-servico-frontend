import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ListChecks, Plus } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useOperationalOrderCatalogPage, useDeleteOperationalOrderCatalog } from '../hooks';
import { OperationalOrderCatalogItem } from '../services';
import { OperationalOrderCatalogRow } from '../components/OperationalOrderCatalogRow';

const PAGE_SIZE = 10;

function buildPageEntries(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const entries: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) entries.push('ellipsis');
  for (let p = start; p <= end; p++) entries.push(p);
  if (end < total - 1) entries.push('ellipsis');
  entries.push(total);
  return entries;
}

const OperationalOrderCatalogListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canManageQuickTasks: canManage } = useUserRole();
  const deleteItem = useDeleteOperationalOrderCatalog();

  const [query, setQuery] = useState(new URLSearchParams(location.search).get('q') ?? '');
  const [page, setPage] = useState(Number(new URLSearchParams(location.search).get('page') ?? 1));

  const { data: catalogPage, isLoading } = useOperationalOrderCatalogPage({
    page,
    pageSize: PAGE_SIZE,
    q: query,
  });
  const items = catalogPage?.items ?? [];
  const totalPages = catalogPage?.totalPages ?? 1;

  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams(location.search);
      if (query) params.set('q', query); else params.delete('q');
      if (page > 1) params.set('page', String(page)); else params.delete('page');
      navigate({ search: params.toString() }, { replace: true });
    }, 250);
    return () => clearTimeout(id);
  }, [page, query, location.search, navigate]);

  useEffect(() => { setPage(1); }, [query]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);

  const handleEdit = (item: OperationalOrderCatalogItem) => {
    navigate(`/dashboard/quick-tasks/catalog/${item.id}/edit`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Catálogo de OS Operacionais</h1>
          <p className="text-muted-foreground">
            Serviços disponíveis para seleção nas Ordens de Serviço Operacionais.
          </p>
        </div>
        <Button
          variant="hero"
          disabled={!canManage}
          onClick={() => navigate('/dashboard/quick-tasks/catalog/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo serviço
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <Input
            placeholder="Buscar por nome ou descrição..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-border">
                      <TableCell><div className="h-4 w-48 rounded bg-muted animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-full rounded bg-muted animate-pulse" /></TableCell>
                      <TableCell><div className="h-8 w-8 rounded bg-muted animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                : items.map((item) => (
                    <OperationalOrderCatalogRow
                      key={item.id}
                      item={item}
                      canManage={canManage}
                      onEdit={handleEdit}
                      onDelete={(id) => deleteItem.mutate(id)}
                    />
                  ))}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <ListChecks className="h-12 w-12" />
                      <div>
                        <h3 className="text-lg font-semibold">Nenhum serviço cadastrado</h3>
                        <p className="text-sm">Crie um serviço para utilizá-lo nas OS Operacionais.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="px-4"><Separator /></div>

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
                  {buildPageEntries(page, totalPages).map((entry, idx) =>
                    entry === 'ellipsis' ? (
                      <PaginationItem key={`e-${idx}`}><PaginationEllipsis /></PaginationItem>
                    ) : (
                      <PaginationItem key={entry}>
                        <PaginationLink
                          href="#"
                          isActive={entry === page}
                          onClick={(e) => { e.preventDefault(); setPage(entry as number); }}
                        >
                          {entry}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationalOrderCatalogListPage;
