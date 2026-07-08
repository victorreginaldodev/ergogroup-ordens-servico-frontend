import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText } from 'lucide-react';
import { useServiceOrders } from '@/services/orders';
import type { ServiceStatus } from '@/types';

const STATUS_DOT: Record<ServiceStatus, string> = {
  pending:     'bg-status-pending',
  in_progress: 'bg-status-progress',
  completed:   'bg-status-completed',
  cancelled:   'bg-status-cancelled',
};

const STATUS_LABEL: Record<ServiceStatus, string> = {
  pending:     'Aberta',
  in_progress: 'Em andamento',
  completed:   'Concluída',
  cancelled:   'Cancelada',
};

const HeaderSearch = () => {
  const [query, setQuery]   = useState('');
  const [open, setOpen]     = useState(false);
  const inputRef            = useRef<HTMLInputElement>(null);
  const navigate            = useNavigate();
  const { data: orders = [] } = useServiceOrders();

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac');

  const q = query.trim().toLowerCase();
  const results = q.length
    ? orders
        .filter(o =>
          o.clientName.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q),
        )
        .slice(0, 8)
    : [];

  const handleSelect = (id: string) => {
    navigate(`/dashboard/orders/${id}/edit`);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-72">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          placeholder="Buscar ordem de serviço..."
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setQuery(''); setOpen(false); inputRef.current?.blur(); }
          }}
          className={
            'w-full h-10 pl-9 pr-14 rounded-md border border-input bg-muted text-sm ' +
            'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0'
          }
        />
        {!query && (
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none inline-flex items-center gap-0.5 rounded border border-input bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        )}
      </div>

      {open && q.length > 0 && (
        <div className="absolute top-full mt-1.5 w-full bg-popover border border-border rounded-md shadow-lg z-50 overflow-hidden">
          {results.length > 0 ? (
            results.map((order) => (
              <button
                key={order.id}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(order.id); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors"
              >
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{order.clientName}</span>
                  <span className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[order.status]}`} />
                    <span className="text-xs text-muted-foreground">{STATUS_LABEL[order.status]}</span>
                    <span className="text-[10px] font-mono text-muted-foreground/70">#{order.id}</span>
                  </span>
                </span>
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-center text-muted-foreground">
              Nenhuma OS encontrada
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderSearch;
