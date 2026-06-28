import { ArrowRight } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { OperationalOrderItem } from '../services';
import { STATUS_DOT, getStatusLabel, formatDate } from '../utils';

const dotBadge = (dotClass: string, label: string) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-foreground">
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
    {label}
  </span>
);

interface OperationalOrderRowProps {
  item: OperationalOrderItem;
  canManage: boolean;
  onEdit: (item: OperationalOrderItem) => void;
}

export function OperationalOrderRow({ item, canManage, onEdit }: OperationalOrderRowProps) {
  return (
    <TableRow
      className={`border-border transition-colors group ${canManage ? 'cursor-pointer hover:bg-muted/40' : ''}`}
      onClick={() => { if (canManage) onEdit(item); }}
    >
      <TableCell className="py-3 px-3">
        <div>
          <span className="text-sm font-semibold uppercase">{item.clienteNome || '—'}</span>
          <div className="flex items-center gap-3 mt-1.5">
            {dotBadge(STATUS_DOT[item.status] ?? 'bg-muted-foreground', getStatusLabel(item.status))}
            <span className="text-[11px] text-muted-foreground uppercase truncate max-w-[200px]">
              {item.servicoNome || '—'}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">#{item.id}</span>
          </div>
        </div>
      </TableCell>

      <TableCell className="py-3 px-3">
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatDate(item.dataRecebimento) ?? '—'}
        </span>
      </TableCell>

      <TableCell className="py-3 px-3">
        <div className="flex justify-end">
          <button
            type="button"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
          >
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}
