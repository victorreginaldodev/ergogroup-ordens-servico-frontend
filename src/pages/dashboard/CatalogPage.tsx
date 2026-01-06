import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { MoreVertical, Edit, Trash2, Wrench } from 'lucide-react';
import { Service } from '@/types';
import { useDeleteService, useServicesCatalog } from '@/services/catalog';
import {
  
} from '@/components/ui/dialog';
import { formatCurrency } from '@/data/mockData';

const CatalogPage = () => {
  const { data: services = [] } = useServicesCatalog();
  const del = useDeleteService();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Catálogo de Serviços</h1>
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground">Gerencie seu catálogo de serviços</p>
          <Button
            onClick={() => navigate('/dashboard/catalog/new')}
            variant="hero"
          >
            Novo serviço
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Serviço</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Não faturável</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((s) => (
                <TableRow key={s.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-sm text-muted-foreground hidden sm:block">{s.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatCurrency(s.price)}</TableCell>
                  <TableCell className="text-muted-foreground">{s.nao_faturavel ? 'Sim' : 'Não'}</TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/catalog/${s.id}/edit`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => del.mutate(s.id)}>
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
          {services.length === 0 && (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum serviço no catálogo</h3>
              <p className="text-muted-foreground mb-4">
                Adicione um novo serviço para começar
              </p>
              <Button
                variant="hero"
                onClick={() => navigate('/dashboard/catalog/new')}
              >
                Novo serviço
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CatalogPage;
