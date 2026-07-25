import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Post } from '@/types';
import { StatusBadge, TypeBadge } from '@/components/StatusBadge';
import { UserAvatar } from '@/components/UserAvatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Trash2, X, Edit3, ImageIcon, ChevronRight, ChevronLeft, Images, Copy, ExternalLink, Link, RotateCcw, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { toDirectImageUrl } from '@/lib/driveUtils';
import { downloadArtes } from '@/lib/downloadArtes';

export function PostDetailModal() {
  const { posts, selectedPostId, setSelectedPostId } = useApp();
  const post = posts.find(p => p.id === selectedPostId);
  const [isEditing, setIsEditing] = useState(false);

  if (!post) return null;

  return (
    <Dialog open={!!selectedPostId} onOpenChange={() => { setSelectedPostId(null); setIsEditing(false); }}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden bg-card border-border scrollbar-thin p-0">
        {isEditing ? (
          <EditMode post={post} onClose={() => setIsEditing(false)} />
        ) : (
          <ViewMode post={post} onEdit={() => setIsEditing(true)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Gallery component ───────────────────────────────────────
function ArteGallery({ artes, titulo }: { artes: string[]; titulo: string }) {
  const [current, setCurrent] = useState(0);

  if (artes.length === 0) {
    return (
      <div className="aspect-video bg-muted flex items-center justify-center">
        <ImageIcon className="w-16 h-16 text-muted-foreground/20" />
      </div>
    );
  }

  return (
    <div className="aspect-video bg-muted relative group">
      <img src={toDirectImageUrl(artes[current])} alt={`${titulo} - ${current + 1}`} className="w-full h-full object-cover" />
      {artes.length > 1 && (
        <>
          <button
            onClick={() => setCurrent(i => (i - 1 + artes.length) % artes.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={() => setCurrent(i => (i + 1) % artes.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {artes.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === current ? 'bg-foreground scale-110' : 'bg-foreground/40 hover:bg-foreground/60'
                )}
              />
            ))}
          </div>
          <div className="absolute top-3 right-3 bg-background/70 backdrop-blur-sm rounded-md px-2 py-0.5 flex items-center gap-1 text-xs text-foreground">
            <Images className="w-3.5 h-3.5" />
            {current + 1}/{artes.length}
          </div>
        </>
      )}
    </div>
  );
}

function ViewMode({ post, onEdit }: { post: Post; onEdit: () => void }) {
  const { posts, getClient, getUser, updatePost, deletePost, statuses } = useApp();
  const client = getClient(post.clienteId);
  const user = getUser(post.responsavelId);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (post.artes.length === 0) { toast.error('Nenhuma arte para baixar'); return; }
    setDownloading(true);
    try {
      await downloadArtes(post, client?.nome || 'Cliente', posts);
      toast.success('Download concluído!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao baixar artes');
    } finally {
      setDownloading(false);
    }
  };

  const idx = statuses.findIndex(s => s.id === post.status);
  const isLastStatus = idx === statuses.length - 1;
  const nextStatusConfig = !isLastStatus && idx >= 0 ? statuses[idx + 1] : null;

  const nextStatus = () => {
    if (!nextStatusConfig) return;
    updatePost(post.id, { status: nextStatusConfig.id });
  };

  const copyLink = () => {
    if (post.linkApresentacao) {
      navigator.clipboard.writeText(post.linkApresentacao);
      toast.success('Link copiado!');
    }
  };

  return (
    <div className="w-full min-w-0">
      <ArteGallery artes={post.artes} titulo={post.titulo} />

      <div className="p-6 space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="font-display font-bold text-xl text-foreground break-words">{post.titulo}</h2>
            <p className="text-sm text-muted-foreground mt-1 break-words">{client?.nome}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {post.artes.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading} className="border-border text-muted-foreground hover:text-foreground">
                <Download className="w-3.5 h-3.5 mr-1" /> {downloading ? 'Baixando...' : 'Baixar Artes'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onEdit} className="border-border text-muted-foreground hover:text-foreground">
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">Excluir post</AlertDialogTitle>
                  <AlertDialogDescription>Tem certeza que deseja excluir este post? Essa ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deletePost(post.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir Post</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <StatusBadge status={post.status} size="md" />
          <TypeBadge type={post.tipo} />
          {post.alterado && (
            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500 gap-1">
              <RotateCcw className="w-3 h-3" />
              Alterado
            </Badge>
          )}
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {format(new Date(post.dataPublicacao), "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </span>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1.5 font-display uppercase tracking-wider">Responsável</p>
          <UserAvatar user={user} size="md" showName />
        </div>

        {nextStatusConfig && (
          <Button
            onClick={nextStatus}
            className="w-full font-display text-white"
            style={{ backgroundColor: `hsl(${nextStatusConfig.color})` }}
          >
            Mover para {nextStatusConfig.label}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}

        {post.legenda && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground font-display uppercase tracking-wider">Legenda</p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 -mr-1" 
                onClick={() => {
                  navigator.clipboard.writeText(post.legenda || '');
                  toast.success('Legenda copiada!');
                }}
              >
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">{post.legenda}</p>
          </div>
        )}

        {post.linkCopywriting && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 font-display uppercase tracking-wider">Link do Documento (Copys)</p>
            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 min-w-0">
              <span className="text-sm text-foreground truncate flex-1 min-w-0">{post.linkCopywriting}</span>
              <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={() => { navigator.clipboard.writeText(post.linkCopywriting); toast.success('Link copiado!'); }}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <a href={post.linkCopywriting} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
          </div>
        )}

        {post.linkApresentacao && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 font-display uppercase tracking-wider">Link da Apresentação</p>
            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 min-w-0">
              <span className="text-sm text-foreground truncate flex-1 min-w-0">{post.linkApresentacao}</span>
              <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={copyLink}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <a href={post.linkApresentacao} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
          </div>
        )}

        {post.observacoes && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5 font-display uppercase tracking-wider">Observações</p>
            <p className="text-sm text-secondary-foreground bg-secondary p-3 rounded-lg whitespace-pre-wrap break-words">{post.observacoes}</p>
          </div>
        )}

        <div className="text-[11px] text-muted-foreground/60 pt-2 border-t border-border flex flex-wrap gap-4">
          <span>Criado: {post.criadoEm}</span>
          <span>Atualizado: {post.atualizadoEm}</span>
        </div>
      </div>
    </div>
  );
}
function EditMode({ post, onClose }: { post: Post; onClose: () => void }) {
  const { updatePost, clients, users, statuses, types: allTypes, visibleTypes, visibleStatuses, visibleClients } = useApp();
  const [form, setForm] = useState({ ...post });
  const [imageUrl, setImageUrl] = useState('');

  const handleSave = () => {
    updatePost(post.id, form);
    onClose();
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

  return (
    <div className="p-6 space-y-4 w-full min-w-0 overflow-x-hidden">
      <DialogHeader>
        <DialogTitle className="font-display text-lg">Editar Post</DialogTitle>
      </DialogHeader>

      {/* Artes */}
      <div>
        <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">
          Artes {form.artes.length > 0 && <span className="text-foreground">({form.artes.length})</span>}
        </label>
        {form.artes.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2 mb-2">
            {form.artes.map((url, i) => (
              <div key={i} className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden group">
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
        )}
        <div className="flex gap-2">
          <Input
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="Cole o link da imagem (https://...)"
            className="bg-secondary border-border text-sm"
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
          />
          <Button size="sm" onClick={addImageUrl} disabled={!imageUrl.trim()} className="shrink-0">
            <Link className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Título</label>
          <Input value={form.titulo} onChange={e => setForm(prev => ({ ...prev, titulo: e.target.value }))} className="bg-secondary border-border" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Data de Publicação</label>
          <Input type="date" value={form.dataPublicacao} onChange={e => setForm(prev => ({ ...prev, dataPublicacao: e.target.value }))} className="bg-secondary border-border" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Cliente</label>
          <Select value={form.clienteId} onValueChange={v => setForm(prev => ({ ...prev, clienteId: v }))}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Responsável</label>
          <Select value={form.responsavelId} onValueChange={v => setForm(prev => ({ ...prev, responsavelId: v }))}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {users.map(u => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Status</label>
          <Select value={form.status} onValueChange={v => setForm(prev => ({ ...prev, status: v }))}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {visibleStatuses.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Tipo</label>
          <Select value={form.tipo} onValueChange={v => setForm(prev => ({ ...prev, tipo: v }))}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {visibleTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Legenda</label>
        <Textarea value={form.legenda} onChange={e => setForm(prev => ({ ...prev, legenda: e.target.value }))} className="bg-secondary border-border min-h-[80px]" />
      </div>

      {post.linkCopywriting && (
        <div>
          <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Link do Documento (Copys)</label>
          <div className="flex gap-2">
            <Input value={form.linkCopywriting} onChange={e => setForm(prev => ({ ...prev, linkCopywriting: e.target.value }))} placeholder="Cole o link do documento com as copys..." className="bg-secondary border-border" />
            <Button variant="outline" size="icon" onClick={() => { if (form.linkCopywriting) { navigator.clipboard.writeText(form.linkCopywriting); toast.success('Link copiado!'); } }} disabled={!form.linkCopywriting} className="border-border shrink-0">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs text-muted-foreground font-display uppercase tracking-wider mb-1.5 block">Observações</label>
        <Textarea value={form.observacoes} onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))} className="bg-secondary border-border" />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onClose} className="border-border">Cancelar</Button>
        <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90 font-display">Salvar</Button>
      </div>
    </div>
  );
}

