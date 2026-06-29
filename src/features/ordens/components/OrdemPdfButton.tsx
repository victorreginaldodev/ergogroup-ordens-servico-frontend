import { PDFDownloadLink } from '@react-pdf/renderer';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrdemPdfDocument } from './OrdemPdfDocument';
import type { OrdemServicoDetalhe, ServicoDetalhe, TarefaDetalhe } from '../services';

interface OrdemPdfButtonProps {
  ordem: OrdemServicoDetalhe;
  servicos: ServicoDetalhe[];
  tarefasPorServico: Record<number, TarefaDetalhe[]>;
  disabled?: boolean;
}

export function OrdemPdfButton({ ordem, servicos, tarefasPorServico, disabled }: OrdemPdfButtonProps) {
  const fileName = `OS-${ordem.id}-${ordem.cliente_detail.nome.replace(/\s+/g, '-')}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <OrdemPdfDocument
          ordem={ordem}
          servicos={servicos}
          tarefasPorServico={tarefasPorServico}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-[10px] px-4 font-bold"
          disabled={disabled || loading}
        >
          {loading
            ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            : <FileDown className="mr-1.5 h-3.5 w-3.5" />}
          {loading ? 'Gerando...' : 'Exportar PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
