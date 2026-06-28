export const formatDate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

export const formatDateTime = (isoStr: string | null | undefined): string | null => {
  if (!isoStr) return null;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(isoStr));
};

export const formatCurrency = (value: string | number): string =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatDateObj = (date: Date): string =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);

export const getStatusLabel = (status: string): string =>
  ({ aberta: 'Aberta', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada' }[status] ?? status);

export const getPriorityLabel = (priority: string): string =>
  ({ baixa: 'Baixa', media: 'Média', alta: 'Alta' }[priority] ?? priority);

export const STATUS_DOT: Record<string, string> = {
  aberta:       'bg-status-pending',
  em_andamento: 'bg-status-progress',
  concluida:    'bg-status-completed',
  cancelada:    'bg-status-cancelled',
};

export const PRIORITY_DOT: Record<string, string> = {
  baixa: 'bg-muted-foreground',
  media: 'bg-yellow-500',
  alta:  'bg-red-600',
};
