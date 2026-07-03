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
  faturada: 'all' | 'true' | 'false';
  responsavel: string;
}

export const defaultFilters: OperationalOrderFiltersState = {
  search: '',
  status: 'all',
  faturada: 'all',
  responsavel: 'all',
};

interface OperationalOrderFiltersProps {
  filters: OperationalOrderFiltersState;
  onChange: (filters: OperationalOrderFiltersState) => void;
  technicianOptions?: { value: string; label: string }[];
}

export function OperationalOrderFilters({ filters, onChange, technicianOptions = [] }: OperationalOrderFiltersProps) {
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
      <div className="w-full sm:w-[180px]">
        <Select
          value={filters.faturada}
          onValueChange={(v) => onChange({ ...filters, faturada: v as OperationalOrderFiltersState['faturada'] })}
        >
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Faturamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Faturamento</SelectItem>
            <SelectItem value="true">Faturado</SelectItem>
            <SelectItem value="false">Não faturado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {technicianOptions.length > 0 && (
        <div className="w-full sm:w-[220px]">
          <Select
            value={filters.responsavel}
            onValueChange={(v) => onChange({ ...filters, responsavel: v })}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Técnico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os técnicos</SelectItem>
              {technicianOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
