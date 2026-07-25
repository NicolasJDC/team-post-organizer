import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';

interface ResponsavelSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (responsavelId: string) => void;
}

export function ResponsavelSelectDialog({ open, onClose, onConfirm }: ResponsavelSelectDialogProps) {
  const { users } = useApp();
  const [selected, setSelected] = useState(users[0]?.id || '');

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Quem será o responsável?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Este post está saindo de Copywriting para Criação. Selecione o novo responsável.
        </p>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder="Selecione o responsável" />
          </SelectTrigger>
          <SelectContent>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose} className="border-border">Cancelar</Button>
          <Button
            onClick={() => { if (selected) onConfirm(selected); }}
            disabled={!selected}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-display"
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
