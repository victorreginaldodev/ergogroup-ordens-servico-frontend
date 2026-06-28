import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface OperationalOrderFiltersState {
  search: string;
  status: string;
}

export const defaultFilters: OperationalOrderFiltersState = {
  search: '',
  status: 'all',
};

interface OperationalOrderFiltersProps {
  filters: OperationalOrderFiltersState;
  onChange: (filters: OperationalOrderFiltersState) => void;
}

export function OperationalOrderFilters({ filters, onChange }: OperationalOrderFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
      <div className="flex-1">
        <Input
          placeholder="Buscar por cliente ou serviço..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="bg-secondary border-border"
        />
      </div>
      <div className="w-full sm:w-[200px]">
        <Select
          value={filters.status}
          onValueChange={(v) => onChange({ ...filters, status: v })}
        >
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="nao_iniciado">Não Iniciado</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="finalizada">Finalizada</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
