import { useState, useMemo, useEffect } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/data/mockData";
import { Service, ServiceItem } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  services: Service[];
  existingIds: string[];
  onAdd: (item: ServiceItem) => void;
  itemToEdit?: ServiceItem;
  onUpdate?: (item: ServiceItem) => void;
};

export default function AddServiceDialog({ open, onOpenChange, services, existingIds, onAdd, itemToEdit, onUpdate }: Props) {
  const [selectedId, setSelectedId] = useState<string>("");
  const selected = useMemo(() => services.find(s => String(s.id) === String(selectedId)), [services, selectedId]);
  const [quantity, setQuantity] = useState<string>("1");
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    if (itemToEdit) {
      setSelectedId(String(itemToEdit.serviceId));
      setQuantity(String(Number.isFinite(itemToEdit.quantity) ? itemToEdit.quantity : 1));
      setUnitPrice(Number.isFinite(itemToEdit.unitPrice) ? itemToEdit.unitPrice : 0);
      setNote(itemToEdit.note || "");
    } else {
      setSelectedId("");
      setQuantity("1");
      setUnitPrice(0);
      setNote("");
    }
  }, [open, itemToEdit]);

  const reset = () => {
    setSelectedId("");
    setQuantity("1");
    setUnitPrice(0);
    setNote("");
  };

  const onSelectService = (id: string) => {
    setSelectedId(id);
    const svc = services.find(s => String(s.id) === String(id));
    setUnitPrice(Number(svc?.price ?? 0));
    setQuantity("1");
    setNote("");
  };

  const handleAdd = () => {
    if (!selected) return;
    if (!note || !note.trim()) return;
    const isDuplicate = existingIds.includes(String(selected.id)) && String(selected.id) !== String(itemToEdit?.serviceId);
    if (isDuplicate) return;
    const parsedQty = parseInt(quantity, 10);
    const payload: ServiceItem = {
      id: itemToEdit ? itemToEdit.id : `${Date.now()}`,
      serviceId: String(selected.id),
      serviceName: selected.name,
      quantity: Math.max(1, isNaN(parsedQty) ? 1 : parsedQty),
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
      total: (Number.isFinite(unitPrice) ? unitPrice : 0) * Math.max(1, isNaN(parsedQty) ? 1 : parsedQty),
      status: itemToEdit ? itemToEdit.status : "pending",
      note: note || "",
    };
    if (itemToEdit && onUpdate) {
      onUpdate(payload);
    } else {
      onAdd(payload);
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Adicionar Serviço</DialogTitle>
          <DialogDescription>Escolha no catálogo e preencha os campos</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Serviço do catálogo</Label>
            <Select value={selectedId} onValueChange={onSelectService}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((svc) => (
                  <SelectItem
                    key={svc.id}
                    value={String(svc.id)}
                    disabled={existingIds.includes(String(svc.id)) && String(svc.id) !== String(itemToEdit?.serviceId)}
                  >
                    {svc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={unitPrice}
                onChange={(e) => {
                  let s = e.target.value ?? '';
                  if (s.startsWith('0') && !s.startsWith('0.') && !s.startsWith('0,')) {
                    s = s.replace(/^0+/, '');
                    if (s === '') s = '0';
                  }
                  e.target.value = s;
                  setUnitPrice(Number(s));
                }}
                className="bg-secondary border-border"
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => {
                  const s = e.target.value ?? '';
                  // Allow empty while typing; normalize on blur or add
                  if (/^\d*$/.test(s)) {
                    setQuantity(s);
                  }
                }}
                onBlur={() => {
                  const n = parseInt(quantity || "0", 10);
                  if (!Number.isFinite(n) || n < 1) setQuantity("1");
                }}
                className="bg-secondary border-border"
                placeholder="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-secondary border-border min-h-40"
              placeholder="Detalhes ou observações do serviço"
            />
            {(!note || !note.trim()) && <p className="text-sm text-destructive">Informe a descrição do serviço.</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { reset(); onOpenChange(false); }}>
              Cancelar
            </Button>
            <Button type="button" variant="hero" onClick={handleAdd} disabled={!selected || !note.trim()}>
              <Plus className="w-4 h-4" />
              {itemToEdit ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
