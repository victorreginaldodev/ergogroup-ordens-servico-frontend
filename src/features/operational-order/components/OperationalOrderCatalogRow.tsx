import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OperationalOrderCatalogItem } from '../services';

interface OperationalOrderCatalogRowProps {
  item: OperationalOrderCatalogItem;
  canManage: boolean;
  onEdit: (item: OperationalOrderCatalogItem) => void;
  onDelete: (id: number) => void;
}

export function OperationalOrderCatalogRow({
  item,
  canManage,
  onEdit,
  onDelete,
}: OperationalOrderCatalogRowProps) {
  return (
    <TableRow className="border-border">
      <TableCell className="font-medium uppercase">{item.nome}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{item.descricao || '-'}</TableCell>
      <TableCell className="text-right">
        {canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (window.confirm('Deseja excluir este serviço do catálogo?')) {
                    onDelete(item.id);
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
  );
}
