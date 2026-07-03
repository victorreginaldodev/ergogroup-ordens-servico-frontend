import { ChevronDown, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type OrdemStatus = 'aberta' | 'em_andamento' | 'concluida' | 'cancelada';
export type OrdemPrioridade = 'baixa' | 'media' | 'alta';

export interface FiltersState {
  search: string;
  status: OrdemStatus[];
  priority: OrdemPrioridade[];
  billing: 'all' | 'paid' | 'released' | 'unpaid';
  contractOnly: boolean;
  dateRange: { from?: Date; to?: Date };
  technicianIds: string[];
}

export const defaultFilters: FiltersState = {
  search: '',
  status: [],
  priority: [],
  billing: 'all',
  contractOnly: false,
  dateRange: {},
  technicianIds: [],
};

const STATUS_OPTIONS: { value: OrdemStatus; label: string }[] = [
  { value: 'aberta',       label: 'Aberta' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida',    label: 'Concluída' },
  { value: 'cancelada',    label: 'Cancelada' },
];

const PRIORITY_OPTIONS: { value: OrdemPrioridade; label: string }[] = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta',  label: 'Alta' },
];

const BILLING_OPTIONS: { value: FiltersState['billing']; label: string }[] = [
  { value: 'all',      label: 'Todos' },
  { value: 'paid',     label: 'Faturado' },
  { value: 'released', label: 'Liberado' },
  { value: 'unpaid',   label: 'Não faturado' },
];

const toInputDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MultiSelect = ({
  label,
  options,
  selected,
  onToggle,
  contentClassName = 'w-44',
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  contentClassName?: string;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" className="gap-1.5 bg-secondary border-border h-9 text-sm">
        {label}
        {selected.length > 0 && (
          <span className="bg-primary text-primary-foreground rounded-full h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold">
            {selected.length}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </Button>
    </PopoverTrigger>
    <PopoverContent className={`${contentClassName} p-1.5`} align="start">
      {options.map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent text-sm select-none"
        >
          <Checkbox
            checked={selected.includes(opt.value)}
            onCheckedChange={() => onToggle(opt.value)}
          />
          {opt.label}
        </label>
      ))}
    </PopoverContent>
  </Popover>
);

interface OrdemServicoFiltrosProps {
  filters: FiltersState;
  onChange: (f: FiltersState) => void;
  technicianOptions?: { value: string; label: string }[];
}

export function OrdemServicoFiltros({ filters, onChange, technicianOptions = [] }: OrdemServicoFiltrosProps) {
  const set = (partial: Partial<FiltersState>) => onChange({ ...filters, ...partial });

  const toggleStatus = (v: string) =>
    set({
      status: filters.status.includes(v as OrdemStatus)
        ? filters.status.filter((s) => s !== v)
        : [...filters.status, v as OrdemStatus],
    });

  const togglePriority = (v: string) =>
    set({
      priority: filters.priority.includes(v as OrdemPrioridade)
        ? filters.priority.filter((p) => p !== v)
        : [...filters.priority, v as OrdemPrioridade],
    });

  const toggleTechnician = (v: string) =>
    set({
      technicianIds: filters.technicianIds.includes(v)
        ? filters.technicianIds.filter((t) => t !== v)
        : [...filters.technicianIds, v],
    });

  const moreCount = [
    filters.billing !== 'all',
    filters.contractOnly,
    !!(filters.dateRange.from || filters.dateRange.to),
  ].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar por cliente, ID ou serviço..."
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          className="pl-10 bg-secondary border-border h-9"
        />
      </div>

      <MultiSelect
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.status}
        onToggle={toggleStatus}
      />

      <MultiSelect
        label="Prioridade"
        options={PRIORITY_OPTIONS}
        selected={filters.priority}
        onToggle={togglePriority}
      />

      {technicianOptions.length > 0 && (
        <MultiSelect
          label="Técnico"
          options={technicianOptions}
          selected={filters.technicianIds}
          onToggle={toggleTechnician}
          contentClassName="w-72"
        />
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-1.5 bg-secondary border-border h-9 text-sm">
            <Filter className="w-3.5 h-3.5" />
            Mais filtros
            {moreCount > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full h-4 min-w-4 px-1 flex items-center justify-center text-[10px] font-bold">
                {moreCount}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4 space-y-4" align="start">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Faturamento</p>
            <div className="flex flex-wrap gap-1.5">
              {BILLING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => set({ billing: opt.value })}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filters.billing === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label className="text-sm cursor-pointer">Apenas contratos</Label>
            <Switch
              checked={filters.contractOnly}
              onCheckedChange={(v) => set({ contractOnly: v })}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Período de criação</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">De</Label>
                <Input
                  type="date"
                  value={filters.dateRange.from ? toInputDate(filters.dateRange.from) : ''}
                  onChange={(e) =>
                    set({ dateRange: { ...filters.dateRange, from: e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined } })
                  }
                  className="bg-secondary border-border h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Até</Label>
                <Input
                  type="date"
                  value={filters.dateRange.to ? toInputDate(filters.dateRange.to) : ''}
                  onChange={(e) =>
                    set({ dateRange: { ...filters.dateRange, to: e.target.value ? new Date(e.target.value + 'T23:59:59') : undefined } })
                  }
                  className="bg-secondary border-border h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
