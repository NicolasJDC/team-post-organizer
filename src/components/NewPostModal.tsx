import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { PostStatus, PostType } from '@/types';
import { getWeekOfMonth } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Copy, Link, PenLine, Palette, FolderOpen, Loader2, CircleDot } from 'lucide-react';
import { toast } from 'sonner';
import { toDirectImageUrl } from '@/lib/driveUtils';
import { supabase } from '@/integrations/supabase/client';

interface NewPostModalProps {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export function NewPostModal({ open, onClose, defaultDate }: NewPostModalProps) {
  const { addPost, clients, users, statuses, visibleTypes, visibleStatuses, visibleClients } = useApp();
  const { user } = useAuth();

  const initialDate = defaultDate || new Date().toISOString().split('T')[0];

  // Auto-assign logged-in user as responsável
  const currentUserAsTeamMember = users.find(u => u.id === user?.id);
  const defaultResponsavel = currentUserAsTeamMember?.id || users[0]?.id || '';

  const [selectedInitialStatus, setSelectedInitialStatus] = useState<string | null>(null);

  const [form, setForm] = useState({
    titulo: '',
    clienteId: clients[0]?.id || '',
    responsavelId: defaultResponsavel,
    dataPublicacao: initialDate,
    legenda: '',
    status: '' as PostStatus,
    tipo: (visibleTypes.find(t => t.id === 'post')?.id || visibleTypes[0]?.id || 'post') as PostType,
    artes: [] as string[],
    linkApresentacao: '',
    linkCopywriting: '',
    observacoes: '',
    alterado: false,
  });

  useEffect(() => {
    if (defaultDate) {
      setForm(prev => ({ ...prev, dataPublicacao: defaultDate }));
    }
  }, [defaultDate]);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setSelectedInitialStatus(null);
    }
  }, [open]);

  const [imageUrl, setImageUrl] = useState('');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [importingDrive, setImportingDrive] = useState(false);

  const importFromDrive = async () => {
    const trimmed = driveFolderUrl.trim();
    if (!trimmed) { toast.error('Cole o link da pasta do Google Drive'); return; }
    setImportingDrive(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-drive-folder', {
        body: { folderUrl: trimmed },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      const urls = (data.images || []).map((img: { url: string }) => img.url);
      if (urls.length === 0) { toast.info('Nenhuma imagem encontrada na pasta'); return; }
      setForm(prev => ({ ...prev, artes: [...prev.artes, ...urls] }));
      setDriveFolderUrl('');
      toast.success(`${urls.length} imagem(ns) importada(s) do Drive!`);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao importar imagens do Drive');
    } finally {
      setImportingDrive(false);
    }
  };

  const generateTitle = (dateStr: string, clienteId: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const weekNum = getWeekOfMonth(date);
    const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const monthAbbr = monthNames[date.getMonth()];
    const client = clients.find(c => c.id === clienteId);
    const clientName = client?.nome || 'Cliente';
    return `SM | S${weekNum}/${monthAbbr} | ${clientName}`;
  };

  const handleSelectStatus = (statusId: string) => {
    setSelectedInitialStatus(statusId);
    setForm(prev => ({ ...prev, status: statusId, responsavelId: defaultResponsavel }));
  };

  const handleSubmit = () => {
    if (!form.clienteId) { toast.error('Selecione um cliente'); return; }
    if (!form.dataPublicacao) { toast.error('Selecione a data de publicação'); return; }
    if (!form.tipo) { toast.error('Selecione o tipo'); return; }
    if (!form.legenda.trim()) { toast.error('Preencha a legenda'); return; }


    const titulo = form.titulo.trim() || generateTitle(form.dataPublicacao, form.clienteId);
    addPost({ ...form, titulo });
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setForm({
      titulo: '', clienteId: clients[0]?.id || '', responsavelId: defaultResponsavel,
      dataPublicacao: new Date().toISOString().split('T')[0], legenda: '',
      status: '', tipo: visibleTypes.find(t => t.id === 'post')?.id || visibleTypes[0]?.id || 'post',
      artes: [], linkApresentacao: '', linkCopywriting: '', observacoes: '', alterado: false,
    });
    setSelectedInitialStatus(null);
  };

  const addImageUrl = () => {
    const trimmed = imageUrl.trim();
    if (trimmed && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
      setForm(prev => ({ ...prev, artes: [...prev.artes, trimmed] }));
      setImageUrl('');
    } else {
      toast.error('Cole um link válido (http:// ou https://)');
    }
  };

  const removeArte = (index: number) => {
    setForm(prev => ({ ...prev, artes: prev.artes.filter((_, i) => i !== index) }));
  };

  const copyLink = () => {
    if (form.linkApresentacao) {
      navigator.clipboard.writeText(form.linkApresentacao);
      toast.success('Link copiado!');
    }
  };

  // Sort statuses by position
  const sortedStatuses = [...statuses].sort((a, b) => (a as any).position - (b as any).position);
  const selectedStatusConfig = statuses.find(s => s.id === selectedInitialStatus);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); resetForm(); } }}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg bg-card border-border scrollbar-thin p-4 sm:p-6 pb-8 !top-[1rem] !translate-y-0 max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Novo Post</DialogTitle>
        </DialogHeader>

        {!selectedInitialStatus ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Onde este post será inserido?</p>
            <div className="grid grid-cols-2 gap-3">
              {sortedStatuses.map(status => (
                <button
                  key={status.id}
                  onClick={() => handleSelectStatus(status.id)}
                  className="flex flex-col items-center gap-3 p-6 rounded-lg border-2 border-border bg-secondary/50 hover:border-primary hover:bg-secondary transition-all group"
                >
                  <CircleDot className="w-8 h-8 transition-colors" style={{ color: `hsl(${status.color})` }} />
                  <span className="font-display font-semibold text-foreground">{status.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <button onClick={() => setSelectedInitialStatus(null)} className="hover:text-foreground transition-colors">
                ← Voltar
              </button>
              <span>·</span>
              <span className="font-display uppercase tracking-wider">
                {selectedStatusConfig?.label || selectedInitialStatus}
              </span>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">
                Artes {form.artes.length > 0 && <span className="text-foreground">({form.artes.length})</span>}
              </label>
              {form.artes.length > 0 && (
                <div className="relative mb-2">
                  <div className="grid grid-cols-4 gap-2">
                    {form.artes.map((url, i) => (
                      <div key={i} className="relative w-full aspect-square rounded-lg overflow-hidden group">
                        <img src={toDirectImageUrl(url)} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeArte(i)}
                          className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-destructive" />
                        </button>
                        <span className="absolute bottom-1 left-1 text-[9px] bg-background/70 rounded px-1 text-foreground">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="Cole o link da imagem (https://...)"
                  className="bg-secondary border-border text-sm"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                />
                <Button type="button" size="sm" onClick={addImageUrl} disabled={!imageUrl.trim()} className="shrink-0">
                  <Link className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="flex items-center gap-2 my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">ou importar pasta do Drive</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="flex gap-2">
                <Input
                  value={driveFolderUrl}
                  onChange={e => setDriveFolderUrl(e.target.value)}
                  placeholder="Cole o link da pasta do Google Drive..."
                  className="bg-secondary border-border text-sm"
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), importFromDrive())}
                  disabled={importingDrive}
                />
                <Button type="button" size="sm" onClick={importFromDrive} disabled={!driveFolderUrl.trim() || importingDrive} className="shrink-0">
                  {importingDrive ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FolderOpen className="w-4 h-4 mr-1" />}
                  Importar
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Título</label>
              <Input value={form.titulo} onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))} placeholder="Deixe vazio para gerar automaticamente" className="bg-secondary border-border" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Data de Publicação *</label>
                <Input type="date" value={form.dataPublicacao} onChange={e => setForm(prev => ({ ...prev, dataPublicacao: e.target.value }))} className="bg-secondary border-border w-full" />
              </div>
              <div className="min-w-0">
                <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Tipo *</label>
                <Select value={form.tipo} onValueChange={v => setForm(prev => ({ ...prev, tipo: v }))}>
                  <SelectTrigger className="bg-secondary border-border w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {visibleTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0">
                <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Cliente *</label>
                <Select value={form.clienteId} onValueChange={v => setForm(prev => ({ ...prev, clienteId: v }))}>
                  <SelectTrigger className="bg-secondary border-border w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
                <div className="min-w-0">
                  <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Responsável *</label>
                  <Select value={form.responsavelId} onValueChange={v => setForm(prev => ({ ...prev, responsavelId: v }))}>
                    <SelectTrigger className="bg-secondary border-border w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {users.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              
            </div>

            
              <div>
                <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Link do Documento (Copys)</label>
                <div className="flex gap-2">
                  <Input value={form.linkCopywriting} onChange={e => setForm(prev => ({ ...prev, linkCopywriting: e.target.value }))} placeholder="Cole o link do documento com as copys..." className="bg-secondary border-border" />
                  <Button variant="outline" size="icon" onClick={() => { if (form.linkCopywriting) { navigator.clipboard.writeText(form.linkCopywriting); toast.success('Link copiado!'); } }} disabled={!form.linkCopywriting} className="border-border shrink-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            

            <div>
              <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Legenda *</label>
              <Textarea value={form.legenda} onChange={e => setForm(prev => ({ ...prev, legenda: e.target.value }))} placeholder="Texto da legenda do post..." className="bg-secondary border-border min-h-[80px]" />
            </div>


            <div>
              <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Observações</label>
              <Textarea value={form.observacoes} onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))} placeholder="Notas internas..." className="bg-secondary border-border" />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { onClose(); resetForm(); }} className="border-border">Cancelar</Button>
              <Button onClick={handleSubmit} className="bg-primary text-primary-foreground hover:bg-primary/90 font-display">Criar Post</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
